import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Mongo } from 'meteor/mongo';

import { messageContext } from '../../../../ui-utils/client/lib/messageContext';
import { APIClient } from '../../../../utils/client';
import { Messages } from '../../../../models/client';
import { upsertMessageBulk } from '../../../../ui-utils/client/lib/RoomHistoryManager';

const LIMIT_DEFAULT = 50;

Template.snippetedMessages.helpers({
	hasMessages() {
		return Template.instance().messages.find().count();
	},
	messages() {
		const instance = Template.instance();
		return instance.messages.find({}, { limit: instance.limit.get(), sort: { ts: -1 } });
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	messageContext,
});

Template.snippetedMessages.onCreated(function () {
	this.rid = this.data.rid;
	this.hasMore = new ReactiveVar(true);
	this.messages = new Mongo.Collection(null);
	this.limit = new ReactiveVar(LIMIT_DEFAULT);

	this.autorun(() => {
		const query = {
			_hidden: { $ne: true },
			snippeted: true,
			rid: this.rid,
		};

		this.cursor && this.cursor.stop();

		this.limit.set(LIMIT_DEFAULT);

		this.cursor = Messages.find(query).observe({
			added: ({ _id, ...message }) => {
				this.messages.upsert({ _id }, message);
			},
			changed: ({ _id, ...message }) => {
				this.messages.upsert({ _id }, message);
			},
			removed: ({ _id }) => {
				this.messages.remove({ _id });
			},
		});
	});

	this.autorun(async () => {
		const limit = this.limit.get();
		const { messages, total } = await APIClient.v1.get(`chat.getSnippetedMessages?roomId=${this.rid}&count=${limit}`);

		upsertMessageBulk({ msgs: messages }, this.messages);

		this.hasMore.set(total > limit);
	});
});

Template.mentionsFlexTab.onDestroyed(function () {
	this.cursor.stop();
});

Template.snippetedMessages.events({
	'scroll .js-list': _.throttle(function (e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
