import { api } from '@rocket.chat/core-services';
import { WebdavAccounts } from '@rocket.chat/models';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

const webdavGetMyAccountsEndpoints = API.v1.get(
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
								_id: {
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
							required: ['_id', 'serverURL', 'username', 'name'],
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
			401: ajv.compile({
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
			}),
		},
	},
	async function action() {
		return API.v1.success({
			accounts: await findWebdavAccountsByUserId({ uid: this.userId }),
		});
	},
);

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

API.v1.post(
	'webdav.removeWebdavAccount',
	{
		authRequired: true,
		validateParams: isPOSTRemoveWebdavAccount,
		body: isPOSTRemoveWebdavAccount,
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
			400: ajv.compile({
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
			}),
			401: ajv.compile({
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
			}),
		},
	},
	async function action() {
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

export type WebdavEndpoints = ExtractRoutesFromAPI<typeof webdavGetMyAccountsEndpoints>;
