import _ from 'underscore';

Template.table.onRendered(function() {
	const dummyTr = '<tr class="table-tr-dummy"></tr>';
	this.$('tbody').prepend(dummyTr).append(dummyTr);

	const onResize = this.data.onResize;
	onResize();
	$(window).on('resize', onResize);
});

Template.table.events({
	'click tbody tr'(e, t) {
		const onItemClick = t.data.onItemClick;

		return onItemClick && onItemClick(this);
	},
	'scroll .table-scroll': _.debounce((e, t) => {
		const onScroll = t.data.onScroll;

		return onScroll && onScroll(e.currentTarget);
	}, 300),
	'click .js-sort'(e, t) {
		t.data.onSort(e.currentTarget.dataset.sort);
	}
});
