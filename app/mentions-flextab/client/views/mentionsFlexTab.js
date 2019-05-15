import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { MentionedMessage } from '../lib/MentionedMessage';
import { messageContext } from '../../../ui-utils/client/lib/messageContext';

Template.mentionsFlexTab.helpers({
	hasMessages() {
		return Template.instance().cursor.count() > 0;
	},
	messages() {
		return Template.instance().cursor;
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

Template.mentionsFlexTab.onCreated(function() {
	this.cursor = MentionedMessage.find({
		rid: this.data.rid,
	}, {
		sort: {
			ts: -1,
		},
	});
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	return this.autorun(() => {
		const mentionedMessageFind = MentionedMessage.find({ rid: this.data.rid });
		return this.subscribe('mentionedMessages', this.data.rid, this.limit.get(), () => {
			if (mentionedMessageFind.count() < this.limit.get()) {
				return this.hasMore.set(false);
			}
		});
	});
});

Template.mentionsFlexTab.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
