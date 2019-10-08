import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { APIClient } from '../../../utils/client';
import { Messages } from '../../../models/client';

Template.mentionsFlexTab.helpers({
	hasMessages() {
		return Template.instance().mentionedMessages.get().length > 0;
	},
	messages() {
		return Template.instance().mentionedMessages.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

const listenForMessageChanges = (instance) => {
	const query = {
		_hidden: { $ne: true },
		'mentions.username': Meteor.user().username,
		rid: instance.data.rid,
	};

	Messages.find(query).observe({
		added: (message) => {
			instance.mentionedMessages.set(instance.mentionedMessages.curValue.concat(message));
		},
		changed: (message) => {
			instance.mentionedMessages.set(instance.mentionedMessages.curValue.map((mentionedMessage) => {
				if (message._id === mentionedMessage._id) {
					mentionedMessage = message;
				}
				return mentionedMessage;
			}));
		},
		removed: ({ _id }) => {
			instance.mentionedMessages.set(instance.mentionedMessages.curValue.filter((message) => message._id !== _id));
		},
	});
};

Template.mentionsFlexTab.onCreated(function() {
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.mentionedMessages = new ReactiveVar([]);

	listenForMessageChanges(this);

	return this.autorun(async () => {
		const { messages, total } = await APIClient.v1.get(`chat.getMentionedMessages?roomId=${ this.data.rid }&count=${ this.limit.get() }`);
		this.mentionedMessages.set(messages);
		this.hasMore.set(total > this.limit.get());
	});
});

Template.mentionsFlexTab.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
