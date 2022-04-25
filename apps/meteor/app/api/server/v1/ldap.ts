import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import { API } from '../api';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { LDAP } from '../../../../server/sdk';

API.v1.addRoute(
	'ldap.testConnection',
	{ authRequired: true },
	{
		async post() {
			if (!this.userId) {
				throw new Error('error-invalid-user');
			}

			if (!hasPermission(this.userId, 'test-admin-options')) {
				throw new Error('error-not-authorized');
			}

			if (settings.get<boolean>('LDAP_Enable') !== true) {
				throw new Error('LDAP_disabled');
			}

			try {
				await LDAP.testConnection();
			} catch (error) {
				SystemLogger.error(error);
				throw new Error('Connection_failed');
			}

			return API.v1.success({
				message: 'Connection_success' as const,
			});
		},
	},
);

API.v1.addRoute(
	'ldap.testSearch',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					username: String,
				}),
			);

			if (!this.userId) {
				throw new Error('error-invalid-user');
			}

			if (!hasPermission(this.userId, 'test-admin-options')) {
				throw new Error('error-not-authorized');
			}

			if (settings.get('LDAP_Enable') !== true) {
				throw new Error('LDAP_disabled');
			}

			await LDAP.testSearch(this.bodyParams.username);

			return API.v1.success({
				message: 'LDAP_User_Found' as const,
			});
		},
	},
);
