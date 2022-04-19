import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../../utils/client';
import { WebdavAccounts } from '../../../models/client';
import { Notifications } from '../../../notifications/client';

const events = {
	changed: (account) => WebdavAccounts.upsert({ _id: account._id }, account),
	removed: ({ _id }) => WebdavAccounts.remove({ _id }),
};

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return;
	}
	const { accounts } = await APIClient.v1.get('webdav.getMyAccounts');
	accounts.forEach((account) => WebdavAccounts.insert(account));
	Notifications.onUser('webdav', ({ type, account }) => events[type](account));
});
