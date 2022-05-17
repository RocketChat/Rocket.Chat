import { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Presence } from '../sdk';

Meteor.methods({
	'UserPresence:setDefaultStatus'(status): Promise<boolean> | undefined {
		const { userId } = this;
		if (!userId) {
			return;
		}
		return Presence.setStatus(userId, status);
	},
	'UserPresence:online'(): Promise<boolean> | undefined {
		const { userId, connection } = this;
		if (!userId || !connection) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.ONLINE, connection.id);
	},
	'UserPresence:away'(): Promise<boolean> | undefined {
		const { userId, connection } = this;
		if (!userId || !connection) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.AWAY, connection.id);
	},
});
