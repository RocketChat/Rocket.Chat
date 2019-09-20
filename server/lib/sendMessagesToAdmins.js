import { Meteor } from 'meteor/meteor';

import { Roles, Users } from '../../app/models/server';

export function sendMessagesToAdmins({
	fromId = 'rocket.cat',
	checkFrom = true,
	msgs = [],
	banners = [],
}) {
	const fromUser = checkFrom ? Users.findOneById(fromId, { fields: { _id: 1 } }) : true;

	Roles.findUsersInRole('admin').forEach((adminUser) => {
		if (fromUser) {
			try {
				Meteor.runAsUser(fromId, () => Meteor.call('createDirectMessage', adminUser.username));

				const rid = [adminUser._id, fromId].sort().join('');

				if (typeof msgs === 'function') {
					msgs = msgs({ adminUser });
				}

				if (!Array.isArray(msgs)) {
					msgs = Array.from(msgs);
				}

				if (typeof banners === 'function') {
					banners = banners({ adminUser });
				}

				if (!Array.isArray(banners)) {
					banners = Array.from(banners);
				}

				Meteor.runAsUser(fromId, () => {
					msgs.forEach((msg) => Meteor.call('sendMessage', Object.assign({ rid }, msg)));
				});
			} catch (e) {
				console.error(e);
			}
		}

		banners.forEach((banner) => Users.addBannerById(adminUser._id, banner));
	});
}
