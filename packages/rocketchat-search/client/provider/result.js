Template.DefaultSearchResultTemplate.onCreated(function() {

	this.data = this.data || {};
	this.result = new ReactiveVar(this.data.result);

	console.log(this.data.result);
});

Template.DefaultSearchResultTemplate.events({
	'click .more'(e, t) {

		let limit = 2;

		if (t.data.payload && t.data.payload.limit) {
			limit = t.data.payload.limit + 1;
		}

		t.data.search(
			t.data.text,
			{limit}
		);
	}
});

Template.DefaultSearchResultTemplate.helpers({
	result() {
		return Template.instance().result.get();
	}
});
