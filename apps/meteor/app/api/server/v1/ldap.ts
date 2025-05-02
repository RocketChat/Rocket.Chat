import { LDAP } from '@rocket.chat/core-services';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import { Match, check } from 'meteor/check';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { API } from '../api';

API.v1.post(
	'ldap.testConnection',
	{
		authRequired: true,
		permissionsRequired: ['test-admin-options'],
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					message: {
						type: 'string',
						enum: ['LDAP_Connection_successful'],
					},
					success: {
						type: 'boolean',
						description: 'Whether the connection was successful or not',
					},
				},
				required: ['success', 'message'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					error: {
						type: 'string',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success', 'error'],
				additionalProperties: false,
			}),
			403: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
					error: {
						type: 'string',
						description: 'Error message',
					},
				},
				required: ['success', 'error'],
				additionalProperties: false,
			}),
		},
	},
	async function () {
		if (!this.userId) {
			return API.v1.unauthorized({ error: 'error-invalid-user' });
		}

		if (settings.get<boolean>('LDAP_Enable') !== true) {
			return API.v1.forbidden({ error: 'LDAP_disabled' });
		}

		try {
			await LDAP.testConnection();
		} catch (error) {
			SystemLogger.error(error);
			return API.v1.forbidden({ error: 'Connection_failed' });
		}

		return API.v1.success({
			message: 'LDAP_Connection_successful' as const,
		});
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
