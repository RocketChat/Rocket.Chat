Template.snippetedMessages.helpers({
	hasMessages() {
		return SnippetedMessage.find({ rid: this.rid }, { sort: { ts: -1 } }).count() > 0
	},
	messages() {
		return SnippetedMessage.find({ rid: this.rid }, { sort: { ts: -1 } });
	},
	message() {
		return _.extend(this, { customClass: "snippeted" });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	}
});

Template.snippetedMessages.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	let self = this;
	this.autorun(function() {
		let data = Template.currentData();
		self.subscribe("snippetedMessages", data.rid, self.limit.get(), function() {
			if (SnippetedMessage.find({rid: data.rid}).count() < self.limit.get()) {
				return self.hasMore.set(false);
			}
		});
	});
});
