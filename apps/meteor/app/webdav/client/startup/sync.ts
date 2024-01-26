import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { WebdavAccounts } from '../../../models/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return;
	}
	const { accounts } = await sdk.rest.get('/v1/webdav.getMyAccounts');
	accounts.forEach((account) => {
		WebdavAccounts.insert(account);
	});

	sdk.stream('notify-user', [`${Meteor.userId()}/webdav`], ({ type, account }) => {
		switch (type) {
			case 'changed':
				WebdavAccounts.upsert({ _id: account._id }, account);
				break;

			case 'removed':
				WebdavAccounts.remove({ _id: account._id });
				break;
		}
	});
});
