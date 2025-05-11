import type { IWebdavAccount, IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

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

export type WebdavEndpoints = {
	'/v1/webdav.getMyAccounts': {
		GET: () => {
			accounts: IWebdavAccountIntegration[];
		};
	};
	'/v1/webdav.removeWebdavAccount': {
		POST: (params: { accountId: IWebdavAccount['_id'] }) => {
			result: DeleteResult;
		};
	};
};
