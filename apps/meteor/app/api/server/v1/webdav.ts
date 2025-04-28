import { api } from '@rocket.chat/core-services';
import { WebdavAccounts } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

type POSTRemoveWebdavAccount = {
	accountId: string;
};

const POSTRemoveWebdavAccountSchema = {
	type: 'object',
	properties: {
		accountId: {
			type: 'string',
		},
	},
	required: ['accountId'],
	additionalProperties: false,
};

const isPOSTRemoveWebdavAccount = ajv.compile<POSTRemoveWebdavAccount>(POSTRemoveWebdavAccountSchema);

const commonUnauthorizedErrorSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'message'],
	additionalProperties: false,
};

const commonBadRequestErrorSchema = {
	type: 'object',
	properties: {
		errorType: {
			type: 'string',
		},
		error: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'errorType', 'error'],
	additionalProperties: false,
};

API.v1
	.get(
		'webdav.getMyAccounts',
		{
			authRequired: true,
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						accounts: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									userId: {
										type: 'string',
									},
									serverURL: {
										type: 'string',
									},
									username: {
										type: 'string',
									},
									name: {
										type: 'string',
									},
								},
								required: ['userId', 'serverURL', 'username', 'name'],
								additionalProperties: false,
							},
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'accounts'],
					additionalProperties: false,
				}),
				401: ajv.compile(commonUnauthorizedErrorSchema),
			},
		},
		async function () {
			const userAccounts = await findWebdavAccountsByUserId({ uid: this.userId });

			// Explicitly map to the desired structure, ensuring only allowed fields are returned
			const accountsForResponse = userAccounts.map((account) => ({
				userId: account.userId,
				serverURL: account.serverURL,
				username: account.username,
				name: account.name,
			}));

			return API.v1.success({
				accounts: accountsForResponse,
			});
		},
	)
	.post(
		'webdav.removeWebdavAccount',
		{
			authRequired: true,
			validateParams: isPOSTRemoveWebdavAccount,
			body: ajv.compile<{
				accountId: string;
			}>({
				type: 'object',
				properties: {
					accountId: {
						type: 'string',
						description: 'The ID of the WebDAV account to remove.',
					},
				},
				required: ['accountId'],
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						result: {
							type: 'object',
							properties: {
								acknowledged: {
									type: 'boolean',
								},
								deletedCount: {
									type: 'integer',
								},
							},
							required: ['acknowledged', 'deletedCount'],
							additionalProperties: false,
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['result', 'success'],
					additionalProperties: false,
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
			},
		},
		async function () {
			const { accountId } = this.bodyParams;

			const removed = await WebdavAccounts.removeByUserAndId(accountId, this.userId);
			if (removed) {
				void api.broadcast('notify.webdav', this.userId, {
					type: 'removed',
					account: { _id: accountId },
				});
			}

			return API.v1.success({ result: removed });
		},
	);
