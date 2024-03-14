import { Meteor } from 'meteor/meteor';

import type { IMessage } from '@rocket.chat/core-typings';

import { ChatMessage, Subscriptions } from '../../app/models/client';
import { CachedCollectionManager } from '../../app/ui-cached-collection/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';


Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		// Only event I found triggers this is from ephemeral messages
		// Other types of messages come from another stream
		sdk.stream('notify-user', [`${Meteor.userId()}/message`], (msg: IMessage) => {
			msg.u = msg.u || { username: 'rocket.cat' };
			msg.private = true;

			return ChatMessage.upsert({ _id: msg._id }, msg);
		});
	});

	CachedCollectionManager.onLogin(() => {
		sdk.stream('notify-user', [`${Meteor.userId()}/mention`], (data) => {
			Subscriptions.update({ rid: data.rid }, { $inc: { unread: 1, userMentions: 1 }, $set: { ts: new Date(), alert: true } });
		});

		sdk.stream('notify-user', [`${Meteor.userId()}/subscriptions-changed`], (_action, sub) => {
			ChatMessage.update(
				{
					rid: sub.rid,
					...('ignored' in sub && sub.ignored ? { 'u._id': { $nin: sub.ignored } } : { ignored: { $exists: true } }),
				},
				{ $unset: { ignored: true } },
				{ multi: true },
			);
			if ('ignored' in sub && sub.ignored) {
				ChatMessage.update(
					{ 'rid': sub.rid, 't': { $ne: 'command' }, 'u._id': { $in: sub.ignored } },
					{ $set: { ignored: true } },
					{ multi: true },
				);
			}
		});
	});
});
