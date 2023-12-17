import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
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
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'restart_server' });
		}

		if ((await hasPermissionAsync(uid, 'restart-server')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'restart_server' });
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
