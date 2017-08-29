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
				url: '/deals/all'
			}).then(function(response){
				models.list = response.deals;
				models.isLoading = false;
			});
		}

		var events = {};
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
				console.log(response)
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

		var views = {};
		views.list = function(){
			return m('table', [
				m('tr', [
					m('th', ''),
					m('th', 'Last modified'),
					m('th', 'ID'),
					m('th', 'Name'),
					m('th', 'Probability'),
					m('th', 'Timeline')
				]),
				models.list.map(function(deal, index){
					return m('tr', [
						m('th', (index + 1)),
						m('td', new Date(deal.hs_lastmodifieddate).toString()),
						m('td', deal.dealId),
						m('td', deal.dealname),
						m('td', deal.probability_),
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
				return [
					m('h2', 'Deals:'),
					(models.isLoading = true && models.list.length == 0 ? 'Loading...' : views.list())
				];
			}
		}

	})();

	document.addEventListener('DOMContentLoaded', function(){
		m.mount(document.getElementById('loading'), LoadingButton);
		m.mount(document.getElementById('deals'), DealsList);
		DealsList.triggers.loadDeals();
	});
})();
