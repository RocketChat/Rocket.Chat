import { Template } from 'meteor/templating';
import _ from 'underscore';

Template.table.onRendered(function () {
	const dummyTr = '<tr class="table-tr-dummy"></tr>';
	this.$('tbody').prepend(dummyTr).append(dummyTr);

	this.onResize = this.data.onResize;
	if (this.onResize) {
		this.onResize();
		$(window).on('resize', this.onResize);
	}
});

Template.table.onDestroyed(function () {
	$(window).on('off', this.onResize);
});

Template.table.events({
	'click tbody tr:not(.table-no-click)'(e, t) {
		t.data.onItemClick && t.data.onItemClick(this);
	},
	'scroll .table-scroll': _.debounce((e, t) => t.data.onScroll && t.data.onScroll(e.currentTarget), 300),
	'click .js-sort'(e, t) {
		t.data.onSort(e.currentTarget.dataset.sort);
	},
});
