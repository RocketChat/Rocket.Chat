import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Logger } from '@rocket.chat/logger';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

const logger = new Logger('Lib:RestartServer');

declare module '@rocket.chat/ddp-client' {
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
				logger.warn('Call to process.exit() timed out, aborting.');
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
