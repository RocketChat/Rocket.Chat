import type { IWebdavAccount } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { WebdavAccounts } from '../../../models/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

const events = {
	changed: (account: IWebdavAccount) => WebdavAccounts.upsert({ _id: account._id }, account),
	removed: ({ _id }: { _id: IWebdavAccount['_id'] }) => WebdavAccounts.remove({ _id }),
};

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return;
	}
	const { accounts } = await sdk.rest.get('/v1/webdav.getMyAccounts');
	accounts.forEach((account) => WebdavAccounts.insert(account));
	sdk.stream('notify-user', [`${Meteor.userId()}/webdav`], ({ type, account }) => events[type](account as IWebdavAccount));
});
