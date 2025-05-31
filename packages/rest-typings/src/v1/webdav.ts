import type { IWebdavAccount, IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';
import type { DeleteResult } from 'mongodb';

type POSTRemoveWebdavAccount = {
	accountId: string;
};

const POSTRemoveWebdavAccountSchema = {
	type: 'object',
	properties: {
		accountId: {
			type: 'string',
			description: 'The WebDAV account ID that you want to remove',
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
