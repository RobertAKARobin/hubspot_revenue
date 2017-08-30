'use strict';

(function(){

	var LoadingButton = (function(){

		var sockets = {
			refresh: (function(){
				var socket = Socket.new();
				socket.onstart = function(){
					models.loading.inProgress = true;
					models.loading.progress = '0';
					m.redraw();
				}
				socket.onmessage = function(response){
					models.loading.progress = Math.round((response.offset * 100) / response.total);
					m.redraw();
				}
				socket.onerror = function(error){
					models.loading.progress = false;
					models.loading.error = error.message;
					m.redraw();
				}
				socket.onclose = function(){
					models.loading.inProgress = false;
					if(!socket.hasErrors){
						DealsList.triggers.loadDeals();
					}
					m.redraw();
				}
				return socket
			}())
		}

		var events = {};
		events.refresh = function(){
			sockets.refresh.send('/refresh');
		}

		var models = {};
		models.loading = {
			error: '',
			progress: 0,
			inProgress: false
		}

		return {
			view: function(){
				var attrs = {};
				var progress = (models.loading.progress ? models.loading.progress + '%' : '');
				var message = (models.loading.inProgress ? 'Loading...' : (models.loading.error || ''));
	
				if(models.loading.inProgress){
					attrs.onclick = null;
				}else{
					attrs.href = '#';
					attrs.onclick = events.refresh;
				}
				return m('p', [
					m('a', attrs, 'Refresh'),
					m('span', (' ' + progress + ' ' + message))
				]);
			}
		}
	})();

	var DealsList = (function(){

		var triggers = {};
		triggers.loadDeals = function(){
			models.isLoading = true;
			m.request({
				url: '/deals/all',
				data: {
					filter: models.filter.input
				}
			}).then(function(response){
				if(response.success){
					models.list = response.deals;
				}else{
					models.filter.response = response.message;
				}
				models.isLoading = false;
			});
		}

		var events = {};
		events.loadDeals = function(event){
			event.redraw = false;
			triggers.loadDeals();
		}
		events.updateTimeline = function(event){
			var deal = this;
			var newTimeline = event.target.value;
			event.redraw = false;
			m.request({
				method: 'POST', 
				url: '/deals/' + deal.dealId,
				background: true,
				data: {
					timeline: newTimeline
				}
			}).then(function(response){
				if(response.success){
					deal.timeline = newTimeline;
					event.target.classList.add('success');
				}else{
					event.target.classList.add('error');
				}
				m.redraw();
			});
		}

		var models = {};
		models.list = [];
		models.isLoading = false;
		models.targetDeal = null;
		models.filter = {
			input: m.stream('closedate >= 1519884000000 AND amount > 159000'),
			response: ''
		}

		var views = {};
		views.date = function(input){
			var dateObject = new Date(input)
			var dateString = dateObject.toISOString().split('T')[0].substring(2);
			return m('span', {
				timestamp: dateObject.getTime(),
				title: dateObject.toLocaleString('fullwide', {
					weekday: 'short',
					year: 'numeric',
					month: 'short',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
					timeZoneName: 'short'
				})
			}, dateString);

		}
		views.filter = function(){
			var form = [
				m('input', m._boundInput(models.filter.input))
			];
			if(!(models.isLoading)){
				form.push(m('button', {
					onclick: events.loadDeals
				}, 'Filter'));
			}
			return [
				m('p', form),
				m('p', models.filter.response)
			]
		}
		views.list = function(){
			return m('table', [
				m('tr', [
					m('th', ''),
					m('th', 'Last modified'),
					m('th', 'Created'),
					m('th', 'ID'),
					m('th', 'Name'),
					m('th', 'Probability'),
					m('th', 'Amount'),
					m('th', 'Close date'),
					m('th', 'Timeline')
				]),
				models.list.map(function(deal, index){
					return m('tr', [
						m('th', (index + 1)),
						m('td', views.date(deal.hs_lastmodifieddate)),
						m('td', views.date(deal.createdate)),
						m('td', deal.dealId),
						m('td', deal.dealname),
						m('td', deal.probability_),
						m('td', '$' + parseFloat(deal.amount).toFixed(2)),
						m('td', views.date(deal.closedate)),
						m('td', [
							m('input', {
								value: deal.timeline,
								onchange: events.updateTimeline.bind(deal)
							})
						])
					]);
				})
			]);
		}

		return {
			triggers: triggers,
			view: function(){
				var output = [
					m('h2', 'Deals:'),
					m('p', views.filter())
				];
				if(models.isLoading){
					output.push('Loading...');
				}
				if(models.list.length > 0){
					output.push(views.list());
				}
				return output;
			}
		}

	})();

	m._boundInput = function(stream, attrs){
		var attrs = (attrs || {});
		attrs.value = stream();
		attrs.oninput = function(event){
			event.redraw = false;
			m.withAttr('value', stream).call({}, event);
		};
		return attrs;
	}

	document.addEventListener('DOMContentLoaded', function(){
		m.mount(document.getElementById('loading'), LoadingButton);
		m.mount(document.getElementById('deals'), DealsList);
		DealsList.triggers.loadDeals();
	});
})();
