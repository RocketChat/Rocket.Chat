import { LDAP } from '@rocket.chat/core-services';
import { Match, check } from 'meteor/check';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { API } from '../api';

API.v1.addRoute(
	'ldap.testConnection',
	{ authRequired: true, permissionsRequired: ['test-admin-options'] },
	{
		async post() {
			if (!this.userId) {
				throw new Error('error-invalid-user');
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
				message: 'LDAP_Connection_successful' as const,
			});
		},
	},
);

API.v1.addRoute(
	'ldap.testSearch',
	{ authRequired: true, permissionsRequired: ['test-admin-options'] },
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
