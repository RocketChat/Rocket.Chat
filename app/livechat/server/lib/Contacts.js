import { check } from 'meteor/check';
import s from 'underscore.string';
import _ from 'underscore';

import {
	LivechatVisitors,
} from '../../../models';

export const Contacts = {

	registerContact({ token, name, email, phone, username, livechatData, contactManager } = {}) {
		check(token, String);

		let userId;
		const updateUser = {
			$set: {
				token,
			},
		};

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			userId = user._id;
		} else {
			if (!username) {
				username = LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
				userId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
				};

				userId = LivechatVisitors.insert(userData);
			}
		}

		updateUser.$set.name = name;

		updateUser.$set.phone = [
			{ phoneNumber: phone?.number },
		];

		updateUser.$set.visitorEmails = [
			{ address: email },
		];

		updateUser.$set.livechatData = livechatData;

		updateUser.$set.contactManager = !_.isEmpty(contactManager) ? contactManager : '';

		LivechatVisitors.updateById(userId, updateUser);

		return userId;
	},
};
