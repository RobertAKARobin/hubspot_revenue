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
			m.request({
				url: '/deals/all'
			}).then(function(response){
				models.list = response.deals;
			});
		}

		var models = {};
		models.list = [];

		return {
			triggers: triggers,
			view: function(){
				return [
					m('h2', 'Deals:'),
					m('table', [
						m('tr', [
							m('th', 'Last modified'),
							m('th', 'ID'),
							m('th', 'Name'),
							m('th', 'Probability')
						]),
						models.list.map(function(deal){
							return m('tr', [
								m('td', new Date(deal.hs_lastmodifieddate).toString()),
								m('td', deal.dealId),
								m('td', deal.dealname),
								m('td', deal.probability_)
							]);
						})
					])
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
