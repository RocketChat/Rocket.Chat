import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../../../app/api/server/api';
import { hasPermissionAsync } from '../../../app/authorization/server/functions/hasPermission';
import { settings } from '../../../app/settings/server';
import { LDAPEE } from '../sdk';

API.v1.post(
	'ldap.syncNow',
	{
		authRequired: true,
		forceTwoFactorAuthenticationForNonEnterprise: true,
		twoFactorRequired: true,
		// license: ['ldap-enterprise'],
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
			400: ajv.compile({
				type: 'object',
				properties: {
					stack: {
						type: 'string',
						description: 'The stack trace of the error.',
					},
					error: {
						type: 'string',
						description: 'The error message.',
					},
					errorType: {
						type: 'string',
						description: 'The type of the error.',
					},
					details: {
						type: 'object',
						nullable: true,
						properties: {
							codeGenerated: { type: 'boolean' },
							method: {
								type: 'string',
								description: 'The method that caused the error.',
							},
							availableMethods: {
								type: 'array',
								items: {
									type: 'string',
									description: 'The available methods.',
								},
							},
						},
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success', 'error', 'errorType', 'details', 'stack'],
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

		if (!(await hasPermissionAsync(this.userId, 'sync-auth-services-users'))) {
			return API.v1.unauthorized({ error: 'error-not-authorized' });
		}

		if (settings.get('LDAP_Enable') !== true) {
			return API.v1.forbidden({ error: 'LDAP_disabled' });
		}

		try {
			await LDAPEE.sync();
			await LDAPEE.syncAvatars();
		} catch (error) {
			return API.v1.failure(error);
		}

		return API.v1.success({
			message: 'Sync_in_progress' as const,
		});
	},
);
