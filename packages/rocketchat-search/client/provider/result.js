Template.DefaultSearchResultTemplate.onCreated(function() {
	const self = this;

	//paging
	this.pageSize = this.data.settings.PageSize;

	//global search
	this.globalSearchEnabled = this.data.settings.GlobalSearchEnabled;

	this.hasMore = new ReactiveVar(true);

	this.autorun(() => {
		const result = this.data.result.get();
		self.hasMore.set(!(result && result.messages.docs.length < (self.data.payload.limit || self.pageSize)));
	});
});

Template.DefaultSearchResultTemplate.events({
	'click .load-more button'(e, t) {
		t.data.payload.limit = (t.data.payload.limit || t.pageSize) + t.pageSize;
		t.data.search();
	},
	'change #global-search'(e, t) {
		t.data.parentPayload.searchAll = e.target.checked;
		t.data.payload.limit = t.pageSize;
		t.data.result.set(undefined);
		t.data.search();

	}
});

Template.DefaultSearchResultTemplate.helpers({
	result() {
		return Template.instance().data.result.get();
	},
	globalSearchEnabled() {
		return Template.instance().globalSearchEnabled;
	},
	searching() {
		return Template.instance().data.searching.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	}
});
