import _ from 'underscore';
import { ReactiveVar } from 'meteor/reactive-var';
import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';

import { messageContext } from '../../../ui-utils/client/lib/messageContext';
import { Messages } from '../../../models/client';
import { APIClient } from '../../../utils/client';
import { upsertMessageBulk } from '../../../ui-utils/client/lib/RoomHistoryManager';

import './DiscussionTabbar.html';

const LIMIT_DEFAULT = 50;

Template.discussionsTabbar.helpers({
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

Template.discussionsTabbar.onCreated(function() {
	this.rid = this.data.rid;
	this.messages = new Mongo.Collection(null);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(LIMIT_DEFAULT);

	this.autorun(() => {
		const query = {
			rid: this.rid,
			drid: { $exists: true },
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
		const { messages, total } = await APIClient.v1.get(`chat.getDiscussions?roomId=${ this.rid }&count=${ limit }`);

		upsertMessageBulk({ msgs: messages }, this.messages);

		this.hasMore.set(total > limit);
	});
});

Template.discussionsTabbar.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			instance.limit.set(instance.limit.get() + LIMIT_DEFAULT);
		}
	}, 200),
});
