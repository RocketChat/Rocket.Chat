import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { SnippetedMessages } from '../../lib/collections';

Template.snippetedMessages.helpers({
	hasMessages() {
		return SnippetedMessages.find({ snippeted:true, rid: this.rid }, { sort: { ts: -1 } }).count() > 0;
	},
	messages() {
		return SnippetedMessages.find({ snippeted: true, rid: this.rid }, { sort: { ts: -1 } });
	},
	message() {
		return _.extend(this, { customClass: 'snippeted', actionContext: 'snippeted' });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
});

Template.snippetedMessages.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	const self = this;
	this.autorun(function() {
		const data = Template.currentData();
		self.subscribe('snippetedMessages', data.rid, self.limit.get(), function() {
			if (SnippetedMessages.find({ snippeted: true, rid: data.rid }).count() < self.limit.get()) {
				return self.hasMore.set(false);
			}
		});
	});
});
