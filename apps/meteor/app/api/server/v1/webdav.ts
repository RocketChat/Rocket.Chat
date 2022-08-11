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

export const isPOSTRemoveWebdavAccount = ajv.compile<POSTRemoveWebdavAccount>(POSTRemoveWebdavAccountSchema);

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

			const result = Meteor.call('removeWebdavAccount', accountId);

			return API.v1.success({ result });
		},
	},
);
