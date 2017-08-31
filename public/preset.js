'use strict';

var Component = {};

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
	},
	query: function(paramsObject){
		var query = m.parseQueryString(window.location.search);
		if(paramsObject){
			for(var key in paramsObject){
				query[key] = paramsObject[key];
			}
			window.location.search = m.buildQueryString(query);
		}
		return query;
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