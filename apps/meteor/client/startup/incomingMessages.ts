import { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { ChatMessage } from '../../app/models/client';
import { Notifications } from '../../app/notifications/client';
import { CachedCollectionManager } from '../../app/ui-cached-collection';

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
		Notifications.onUser('subscriptions-changed', (_action: unknown, sub: ISubscription) => {
			const ignored = sub?.ignored ? { $nin: sub.ignored } : { $exists: true };

			ChatMessage.update({ rid: sub.rid, ignored }, { $unset: { ignored: true } }, { multi: true });
			if (sub?.ignored) {
				ChatMessage.update(
					{ 'rid': sub.rid, 't': { $ne: 'command' }, 'u._id': { $in: sub.ignored } },
					{ $set: { ignored: true } },
					{ multi: true },
				);
			}
		});
	});
});
