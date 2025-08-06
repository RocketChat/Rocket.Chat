import type { IMessage } from '@rocket.chat/core-typings';

import { Meteor } from 'meteor/meteor';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { Messages } from '../stores';

Meteor.startup(() => {
	onLoggedIn(() => {
		// Only event I found triggers this is from ephemeral messages
		// Other types of messages come from another stream
		return sdk.stream('notify-user', [`${Meteor.userId()}/message`], (msg: IMessage) => {
			msg.u = msg.u || { username: 'rocket.cat' };
			msg.private = true;

			return Messages.state.store(msg);
		});
	});

	onLoggedIn(() => {
		return sdk.stream('notify-user', [`${Meteor.userId()}/subscriptions-changed`], (_action, sub) => {
			Messages.state.update(
				(record) => record.rid === sub.rid && ('ignored' in sub && sub.ignored ? !sub.ignored.includes(record.u._id) : 'ignored' in record),
				({ ignored: _, ...record }) => record,
			);
			if ('ignored' in sub && sub.ignored) {
				Messages.state.update(
					(record) => record.rid === sub.rid && record.t !== 'command' && (sub.ignored?.includes(record.u._id) ?? false),
					(record) => ({ ...record, ignored: true }),
				);
			}
		});
	});
});
