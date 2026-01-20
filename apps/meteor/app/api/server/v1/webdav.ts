import { api } from '@rocket.chat/core-services';
import { WebdavAccounts } from '@rocket.chat/models';
import {
	BadRequestErrorResponseSchema,
	UnauthorizedErrorResponseSchema,
	GETWebdavGetMyAccountsResponseSchema,
	POSTWebdavRemoveWebdavAccountBodySchema,
	POSTWebdavRemoveWebdavAccountResponseSchema,
} from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { findWebdavAccountsByUserId } from '../lib/webdav';

const webdavEndpoints = API.v1
	.get(
		'webdav.getMyAccounts',
		{
			authRequired: true,
			response: {
				200: GETWebdavGetMyAccountsResponseSchema,
				401: UnauthorizedErrorResponseSchema,
			},
		},
		async function action() {
			return API.v1.success({
				accounts: await findWebdavAccountsByUserId({ uid: this.userId }),
			});
		},
	)
	.post(
		'webdav.removeWebdavAccount',
		{
			authRequired: true,
			body: POSTWebdavRemoveWebdavAccountBodySchema,
			response: {
				200: POSTWebdavRemoveWebdavAccountResponseSchema,
				400: BadRequestErrorResponseSchema,
				401: UnauthorizedErrorResponseSchema,
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

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends ExtractRoutesFromAPI<typeof webdavEndpoints> {}
}
