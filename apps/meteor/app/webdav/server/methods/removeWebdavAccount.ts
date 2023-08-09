import { api } from '@rocket.chat/core-services';
import type { IWebdavAccount } from '@rocket.chat/core-typings';
import { WebdavAccounts } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { DeleteResult } from 'mongodb';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeWebdavAccount(accountId: IWebdavAccount['_id']): DeleteResult;
	}
}

Meteor.methods<ServerMethods>({
	async removeWebdavAccount(accountId) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid User', {
				method: 'removeWebdavAccount',
			});
		}

		check(accountId, String);

		methodDeprecationLogger.method('removeWebdavAccount', '7.0.0');

		const removed = await WebdavAccounts.removeByUserAndId(accountId, userId);
		if (removed) {
			void api.broadcast('notify.webdav', userId, {
				type: 'removed',
				account: { _id: accountId },
			});
		}

		return removed;
	},
});
