'use strict';

document.addEventListener('DOMContentLoaded', function(){
	m.mount(document.getElementById('refresher'), Component.Refresher);
	m.mount(document.getElementById('deals'), Component.DealsList);
	Component.DealsList.triggers.loadDeals();
}, false);
