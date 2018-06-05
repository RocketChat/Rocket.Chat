Template.table.onRendered(function() {
	const dummyTr = '<tr class="tr-dummy"></tr>';
	this.$('tbody').prepend(dummyTr).append(dummyTr);
});
