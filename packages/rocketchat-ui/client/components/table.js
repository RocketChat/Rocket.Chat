Template.table.onRendered(function() {
	const dummyTr = '<tr class="table-tr-dummy"></tr>';
	this.$('tbody').prepend(dummyTr).append(dummyTr);
});

Template.table.events({
	'click tbody tr'() {
		const onItemClick = Template.instance().data.onItemClick;
		if (onItemClick) {
			onItemClick(this);
			return;
		}

		return false;
	}
});
