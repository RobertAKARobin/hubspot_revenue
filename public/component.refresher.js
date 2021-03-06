'use strict';

Component.Refresher = (function(){

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
			Component.DealsList.triggers.loadDeals();
		}
		m.redraw();
	}

	var events = {};
	events.refresh = function(){
		socket.send('/refresh');
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

			return m('p', [
				m('button', {
					disabled: (models.loading.inProgress),
					onclick: (models.loading.inProgress ? null : events.refresh)
				}, 'Refresh'),
				m('span', (' ' + progress + ' ' + message))
			]);
		}
	}
})();