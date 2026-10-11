import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';

import type { Server } from '../ddp/Server';

export function registerPresenceMethods(server: Server): void {
	server.methods({
		'UserPresence:setDefaultStatus'(status) {
			const { userId } = this;
			if (!userId) {
				return;
			}
			return Presence.setStatus(userId, status);
		},
		'UserPresence:online'() {
			const { userId, session } = this;
			if (!userId) {
				return;
			}
			return Presence.setConnectionStatus(userId, UserStatus.ONLINE, session);
		},
		'UserPresence:away'() {
			const { userId, session } = this;
			if (!userId) {
				return;
			}
			return Presence.setConnectionStatus(userId, UserStatus.AWAY, session);
		},
		'setUserStatus'(status, statusText) {
			const { userId } = this;
			if (!userId) {
				return;
			}
			return Presence.setStatus(userId, status, statusText);
		},
	});
}
