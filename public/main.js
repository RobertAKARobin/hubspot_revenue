'use strict';

(function(){

	var Component = (function(){
		var message;

		var events = {};
		events.refresh = function(){
			var stream = new EventSource('/timer');
			stream.onmessage = function(response){
				if(response.data == 'CLOSE'){
					models.loading.inProgress = false;
					stream.close();
				}else{
					models.loading.inProgress = true;
					models.loading.status = response.data;
				}
				m.redraw();
			}
		}

		var views = {};
		views.loadingButton = function(){
			var attrs = {};
			var content = '';
			if(models.loading.inProgress){
				attrs.onclick = null;
				content = models.loading.status + '%';
			}else{
				attrs.href = '#';
				attrs.onclick = events.refresh;
				content = 'Refresh';
			}
			return m('a', attrs, content);
		}

		var models = {};
		models.loading = {
			status: 0,
			inProgress: false
		}

		return {
			oninit: function(){
				m.request({
					url: '/api'
				}).then(function(response){
					if(response.success){
						message = response.message;
					}else{
						message = 'Errare humanum est.';
					}
				});
			},
			view: function(){
				return [
					m('h1', 'The API says: ' + message),
					views.loadingButton()
				]
			}
		}
	})();

	document.addEventListener('DOMContentLoaded', function(){
		m.mount(document.getElementById('display'), Component);
	});
})();
