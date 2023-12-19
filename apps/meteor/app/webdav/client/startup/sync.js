import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { WebdavAccounts } from '../../../models/client';
import { Notifications } from '../../../notifications/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

const events = {
	changed: (account) => WebdavAccounts.upsertAsync({ _id: account._id }, account),
	removed: ({ _id }) => WebdavAccounts.remove({ _id }),
};

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return;
	}
	const { accounts } = await sdk.rest.get('/v1/webdav.getMyAccounts');
	accounts.forEach((account) => WebdavAccounts.insert(account));
	Notifications.onUser('webdav', ({ type, account }) => events[type](account));
});
