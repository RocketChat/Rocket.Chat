import type { IMessage } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages } from '../../app/models/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';

Meteor.startup(() => {
	onLoggedIn(() => {
		// Only event I found triggers this is from ephemeral messages
		// Other types of messages come from another stream
		return sdk.stream('notify-user', [`${Meteor.userId()}/message`], (msg: IMessage) => {
			msg.u = msg.u || { username: 'rocket.cat' };
			msg.private = true;

			return Messages.upsert({ _id: msg._id }, msg);
		});
	});

	onLoggedIn(() => {
		return sdk.stream('notify-user', [`${Meteor.userId()}/subscriptions-changed`], (_action, sub) => {
			Messages.update(
				{
					rid: sub.rid,
					...('ignored' in sub && sub.ignored ? { 'u._id': { $nin: sub.ignored } } : { ignored: { $exists: true } }),
				},
				{ $unset: { ignored: true } },
				{ multi: true },
			);
			if ('ignored' in sub && sub.ignored) {
				Messages.update(
					{ 'rid': sub.rid, 't': { $ne: 'command' }, 'u._id': { $in: sub.ignored } },
					{ $set: { ignored: true } },
					{ multi: true },
				);
			}
		});
	});
});
