import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { APIClient } from '../../../utils/client';
import { WebdavAccounts } from '../../../models/client';
import { webdavStreamer } from '../lib/streamer';

Tracker.autorun(async () => {
	if (Meteor.userId()) {
		const { accounts } = await APIClient.v1.get('webdav.getMyAccounts');
		accounts.forEach((account) => WebdavAccounts.insert(account));
	}
	webdavStreamer.on('webdavAccounts', (account) => {
		const events = {
			changed: () => {
				delete account.type;
				WebdavAccounts.upsert({ _id: account._id }, account);
			},
			removed: () => WebdavAccounts.remove({ _id: account._id }),
		};
		events[account.type]();
	});
});
