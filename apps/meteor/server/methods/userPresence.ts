import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'UserPresence:setDefaultStatus'(status: UserStatus): boolean | undefined;
		'UserPresence:online'(): boolean | undefined;
		'UserPresence:away'(): boolean | undefined;
	}
}

Meteor.methods<ServerMethods>({
	'UserPresence:setDefaultStatus'(status) {
		methodDeprecationLogger.method('UserPresence:setDefaultStatus', '9.0.0', '/v1/users.setStatus');
		const { userId } = this;
		if (!userId) {
			return;
		}
		return Presence.setStatus(userId, status);
	},
	'UserPresence:online'() {
		const { userId, connection } = this;
		if (!userId || !connection) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.ONLINE, connection.id);
	},
	'UserPresence:away'() {
		const { userId, connection } = this;
		if (!userId || !connection) {
			return;
		}
		return Presence.setConnectionStatus(userId, UserStatus.AWAY, connection.id);
	},
});
