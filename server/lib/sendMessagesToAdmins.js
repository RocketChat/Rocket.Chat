
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from './logger/system';
import { Users } from '../../app/models/server';
import { Roles } from '../../app/models/server/raw';

export async function sendMessagesToAdmins(message) {
	const fromUser = message.checkFrom ? Users.findOneById(message.fromId, { fields: { _id: 1 } }) : true;
	const users = await Roles.findUsersInRole('admin');

	users.forEach((adminUser) => {
		if (fromUser) {
			try {
				Meteor.runAsUser(message.fromId, () => Meteor.call('createDirectMessage', adminUser.username));

				const rid = [adminUser._id, message.fromId].sort().join('');

				if (typeof message.msgs === 'function') {
					message.msgs = message.msgs({ adminUser });
				}

				if (!Array.isArray(message.msgs)) {
					message.msgs = [message.msgs];
				}

				if (typeof message.banners === 'function') {
					message.banners = message.banners({ adminUser });
				}

				if (!Array.isArray(message.banners)) {
					message.banners = [message.banners];
				}

				Meteor.runAsUser(message.fromId, () => {
					message.msgs.forEach((msg) => Meteor.call('sendMessage', Object.assign({ rid }, msg)));
				});
			} catch (e) {
				SystemLogger.error(e);
			}
		}

		message.banners.forEach((banner) => Users.addBannerById(adminUser._id, banner));
	});
}
