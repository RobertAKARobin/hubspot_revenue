'use strict';

Component.DealsList = (function(){

	var triggers = {};
	triggers.loadDeals = function(){
		models.isLoading = true;
		models.filter.response = '';
		m.request({
			url: '/deals',
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
		helpers.query({filter: models.filter.input()})
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
	models.filter = {
		input: m.stream(helpers.query().filter),
		response: ''
	}

	var views = {};
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
			m('p', {
				title: models.filter.response
			}, (models.filter.response ? 'Your input was bad. Try again.' : ''))
		]
	}
	views.headerRow = function(){
		return m('tr', [
			m('th', ''),
			m('th', 'Last modified'),
			m('th', 'Created'),
			m('th', 'ID'),
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
			m('td', helpers.date(deal.hs_lastmodifieddate)),
			m('td', helpers.date(deal.createdate)),
			m('td', deal.dealId),
			m('td', deal.dealname),
			m('td', deal.probability_),
			m('td', '$' + parseFloat(deal.amount).toFixed(2)),
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