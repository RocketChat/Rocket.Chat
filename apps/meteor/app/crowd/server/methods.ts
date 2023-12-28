import type { ServerMethods, TranslationKey } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { settings } from '../../settings/server';
import { CROWD } from './crowd';
import { logger } from './logger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		crowd_test_connection(): { message: TranslationKey; params: string[] };
		crowd_sync_users(): { message: string; params: string[] };
	}
}

Meteor.methods<ServerMethods>({
	async crowd_test_connection() {
		const user = await Meteor.userAsync();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'crowd_test_connection',
			});
		}

		if (!(await hasPermissionAsync(user._id, 'test-admin-options'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'crowd_test_connection',
			});
		}

		if (settings.get('CROWD_Enable') !== true) {
			throw new Meteor.Error('crowd_disabled');
		}

		try {
			const crowd = new CROWD();
			await crowd.checkConnection();

			return {
				message: 'Connection_success' as const,
				params: [],
			};
		} catch (err) {
			logger.error({
				msg: 'Invalid crowd connection details, check the url and application username/password and make sure this server is allowed to speak to crowd',
				err,
			});
			throw new Meteor.Error('Invalid connection details', '', { method: 'crowd_test_connection' });
		}
	},
	async crowd_sync_users() {
		const user = await Meteor.userAsync();
		if (settings.get('CROWD_Enable') !== true) {
			throw new Meteor.Error('crowd_disabled');
		}

		if (!user || !(await hasPermissionAsync(user._id, 'sync-auth-services-users'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'crowd_sync_users',
			});
		}

		try {
			const crowd = new CROWD();
			const startTime = Date.now();
			await crowd.sync();
			const stopTime = Date.now();
			const actual = Math.ceil((stopTime - startTime) / 1000);

			return {
				message: `User data synced in ${actual} seconds`,
				params: [],
			};
		} catch (err) {
			logger.error({ msg: 'Error syncing user data. ', err });
			throw new Meteor.Error('Error syncing user data', '', { method: 'crowd_sync_users' });
		}
	},
});
