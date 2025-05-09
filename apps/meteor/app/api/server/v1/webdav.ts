import { api } from '@rocket.chat/core-services';
import { WebdavAccounts } from '@rocket.chat/models';
import Ajv from 'ajv';

import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

// TO-DO: remove this AJV instance and import one from the core-typings
const ajv = new Ajv({ coerceTypes: true });

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

API.v1.addRoute(
	'webdav.getMyAccounts',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success({
				accounts: await findWebdavAccountsByUserId({ uid: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'webdav.removeWebdavAccount',
	{
		authRequired: true,
		validateParams: isPOSTRemoveWebdavAccount,
	},
	{
		async post() {
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
	},
);
