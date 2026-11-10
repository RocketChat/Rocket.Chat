import { ClientSafeError } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		restart_server(): {
			message: string;
			params: [number];
		};
	}
}

Meteor.methods<ServerMethods>({
	async restart_server() {
		const uid = Meteor.userId();

		if (!uid) {
			throw new ClientSafeError('error-unauthenticated', 'Unauthenticated', { method: 'restart_server' });
		}

		if ((await hasPermissionAsync(uid, 'restart-server')) !== true) {
			throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'restart_server' });
		}

		setTimeout(() => {
			setTimeout(() => {
				console.warn('Call to process.exit() timed out, aborting.');
				process.abort();
			}, 1000);
			process.exit(1);
		}, 1000);

		return {
			message: 'The_server_will_restart_in_s_seconds',
			params: [2],
		};
	},
});
