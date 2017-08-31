'use strict';

Component.DealsList = (function(){

	var triggers = {};
	triggers.loadDeals = function(){
		models.isLoading = true;
		models.server_response = '';
		m.request({
			url: '/deals',
			data: {
				filter: models.filter,
				projection_start_month: models.projection_start_month,
				projection_start_year: models.projection_start_year,
				projection_month_range: models.projection_month_range
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
		helpers.query({filter: models.filter()})
		triggers.loadDeals();
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
	models.filter = m.stream(helpers.query().filter);
	models.server_response = '';
	models.projection_start_month = m.stream((new Date()).getMonth() + 1);
	models.projection_start_year = m.stream((new Date()).getFullYear());
	models.projection_month_range = m.stream(1);

	var views = {};
	views.filter = function(){
		var form = [
			m('span', 'Projections starting '),
			m('input', m._boundInput(models.projection_start_year, {
				type: 'number',
				min: 2010,
				max: 2030
			})),
			m('span', ' - '),
			m('input', m._boundInput(models.projection_start_month, {
				type: 'number',
				min: 1,
				max: 12
			})),
			m('span', ' and out '),
			m('input', m._boundInput(models.projection_month_range, {
				type: 'number',
				min: 1,
				max: 12
			})),
			m('span', ' months')
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
	views.headerRow = function(){
		return m('tr', [
			m('th', ''),
			m('th', 'Created'),
			m('th', 'Name'),
			m('th', 'Probability'),
			m('th', 'Amount'),
			m('th', 'Close date'),
			m('th', 'Timeline'),
			m('th', 'Timeline end')
		]);
	}
	views.bodyRow = function(deal, index){
		return m('tr', [
			m('th', (index + 1)),
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