import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { SnippetedMessages } from '../../lib/collections';
import { messageContext } from '../../../../ui-utils/client/lib/messageContext';

Template.snippetedMessages.helpers({
	hasMessages() {
		return Template.instance().cursor.count() > 0;
	},
	messages() {
		return Template.instance().cursor;
	},
	message() {
		return _.extend(this, { customClass: 'snippeted', actionContext: 'snippeted' });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

Template.snippetedMessages.onCreated(function() {
	this.rid = this.data.rid;
	this.cursor = SnippetedMessages.find({ snippeted: true, rid: this.data.rid }, { sort: { ts: -1 } });
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.autorun(() => {
		const data = Template.currentData();
		this.subscribe('snippetedMessages', data.rid, this.limit.get(), function() {
			if (this.cursor.count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});
