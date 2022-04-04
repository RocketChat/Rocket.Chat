import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';
import { APIClient } from '../../../utils/client';
import { Messages, Users } from '../../../models/client';
import { getCommonRoomEvents } from '../../../ui/client/views/app/lib/getCommonRoomEvents';

const LIMIT_DEFAULT = 50;

Template.mentionsFlexTab.helpers({
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

Template.mentionsFlexTab.onCreated(function () {
	this.messages = new Mongo.Collection(null);

	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(LIMIT_DEFAULT);

	this.autorun(() => {
		const query = {
			'_hidden': { $ne: true },
			'mentions.username': Users.findOne(Meteor.userId(), { fields: { username: 1 } }).username,
			'rid': this.data.rid,
			'_updatedAt': {
				$gt: new Date(),
			},
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
		const { messages, total } = await APIClient.v1.get(`chat.getMentionedMessages?roomId=${this.data.rid}&count=${limit}`);

		upsertMessageBulk({ msgs: messages }, this.messages);

		this.hasMore.set(total > limit);
	});
});

Template.mentionsFlexTab.onDestroyed(function () {
	this.cursor.stop();
});

Template.mentionsFlexTab.events({
	...getCommonRoomEvents(),
	'scroll .js-list': _.throttle(function (e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			return instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),
});
