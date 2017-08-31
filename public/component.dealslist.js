'use strict';

Component.DealsList = (function(){

	var triggers = {};
	triggers.loadDeals = function(){
		models.isLoading = true;
		models.server_response = '';
		m.request({
			url: '/deals',
			data: {
				filter: models.filter
			}
		}).then(function(response){
			if(response.success){
				models.list = response.deals;
			}else{
				models.server_response = response.message;
			}
			models.isLoading = false;
		});
	}

	var events = {};
	events.loadDeals = function(event){
		event.redraw = false;
		helpers.query(models.filter);
		triggers.loadDeals();
	}
	events.sort = function(propertyName){
		models.sortProperty = propertyName;
		models.sortDirection = (models.sortDirection == 'asc' ? 'desc' : 'asc');
		models.list.sort(function(a, b){
			var valA = (parseFloat(a[propertyName]) || a[propertyName]);
			var valB = (parseFloat(b[propertyName]) || b[propertyName]);
			if(isNaN(valA) || isNaN(valB)){
				valA = a[propertyName].toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
				valB = b[propertyName].toString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
			}
			if(models.sortDirection == 'asc'){
				return(valA > valB ? 1 : -1)
			}else{
				return(valA < valB ? 1 : -1)
			}
		});
	}
	events.updateTimeline = function(event){
		var deal = this;
		var newTimeline = event.target.value;
		event.redraw = false;
		m.request({
			method: 'PATCH', 
			url: '/deals/' + deal.dealId,
			background: true,
			data: {
				timeline: newTimeline
			}
		}).then(function(response){
			if(response.success){
				deal.timeline = newTimeline;
				event.target.classList.add('success');
				event.target.removeAttribute('title');
			}else{
				event.target.classList.add('error');
				event.target.setAttribute('title', response.message);
			}
			m.redraw();
		});
	}

	var models = {};
	models.list = [];
	models.isLoading = false;
	models.sortProperty = '';
	models.sortDirection = 'asc';
	models.server_response = '';
	models.filter = {
		probability_low: m.stream(helpers.query().probability_low || 50),
		probability_high: m.stream(helpers.query().probability_high || 100),
		projection_start_month: m.stream(helpers.query().projection_start_month || (new Date()).getMonth() + 1),
		projection_start_year: m.stream(helpers.query().projection_start_year || (new Date()).getFullYear()),
		projection_month_range: m.stream(helpers.query().projection_month_range || 1)
	}

	var views = {};
	views.filter = function(){
		var form = [
			m('p', [
				m('span', 'Projections starting '),
				m('input', m._boundInput(models.filter.projection_start_year, {
					type: 'number',
					min: 2010,
					max: 2030
				})),
				m('span', ' - '),
				m('input', m._boundInput(models.filter.projection_start_month, {
					type: 'number',
					min: 1,
					max: 12
				})),
				m('span', ' and out '),
				m('input', m._boundInput(models.filter.projection_month_range, {
					type: 'number',
					min: 1,
					max: 12
				})),
				m('span', ' months')
			]),
			m('p', [
				m('span', 'Probability between '),
				m('input', m._boundInput(models.filter.probability_low, {
					type: 'number',
					min: 0,
					max: 99
				})),
				m('span', ' and '),
				m('input', m._boundInput(models.filter.probability_high, {
					type: 'number',
					min: 1,
					max: 100
				}))
			])
		];
		if(!(models.isLoading)){
			form.push(m('button', {
				onclick: events.loadDeals
			}, 'Filter'));
		}
		return [
			m('p', form),
			m('p', {
				title: models.server_response
			}, (models.server_response ? 'Your input was bad. Try again.' : ''))
		]
	}
	views.sortable = function(propertyName){
		return {
			sort_property: propertyName,
			sorting: (propertyName == models.sortProperty ? models.sortDirection : ''),
			onclick: m.withAttr('sort_property', events.sort),
		}
	}
	views.headerRow = function(){
		return m('tr', [
			m('th', ''),
			m('th', views.sortable('createdate'), 'Created'),
			m('th', views.sortable('dealname'), 'Name'),
			m('th', views.sortable('probability_'), 'Probability'),
			m('th', views.sortable('amount'), 'Amount'),
			m('th', views.sortable('closedate'), 'Close date'),
			m('th', 'Timeline'),
			m('th', 'Timeline end')
		]);
	}
	views.bodyRow = function(deal, index){
		return m('tr', [
			m('th', (models.list.length - index)),
			m('td', helpers.date(deal.createdate)),
			m('td', deal.dealname),
			m('td', deal.probability_),
			m('td', '$'+ deal.amount),
			m('td', helpers.date(deal.closedate)),
			m('td', [
				m('input', {
					value: deal.timeline,
					onchange: events.updateTimeline.bind(deal)
				})
			]),
			m('td', helpers.date(deal.projection_enddate)),
			deal.projection.map(views.projection_segment)
		]);
	}
	views.projection_segment = function(segment){
		return m('td', [
			m('input', {
				value: segment.raw
			}),
			m('p', '$' + segment.dollars),
		])
	}
	views.list = function(){
		return m('table', [
			views.headerRow(),
			models.list.map(views.bodyRow)
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