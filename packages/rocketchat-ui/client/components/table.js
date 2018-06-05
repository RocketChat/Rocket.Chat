Template.table.onRendered(function() {
	const dummyTr = '<tr class="table-tr-dummy"></tr>';
	this.$('tbody').prepend(dummyTr).append(dummyTr);
	this.$('th').each(function() {
		$(this).append(`<div class="table-fake-th">${ $(this).html() }</div>`);
	});
});
