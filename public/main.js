'use strict';

var helpers = {
	date: function(input){
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
}

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
	m.mount(document.getElementById('refresher'), Refresher);
	m.mount(document.getElementById('deals'), DealsList);
	DealsList.triggers.loadDeals();
}, false);
