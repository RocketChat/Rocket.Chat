import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { CachedCollectionManager } from '../../app/ui-cached-collection/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		Notifications.onUser('message', (msg: IMessage) => {
			msg.u = msg.u || { username: 'rocket.cat' };
			msg.private = true;

			return ChatMessage.upsert({ _id: msg._id }, msg);
		});
	});

	CachedCollectionManager.onLogin(() => {
		Notifications.onUser('subscriptions-changed', (_action, sub) => {
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
