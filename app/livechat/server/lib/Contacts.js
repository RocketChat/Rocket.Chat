import { check } from 'meteor/check';
import s from 'underscore.string';

import {
	LivechatVisitors,
} from '../../../models';

export const Contacts = {

	registerContact({ token, name, email, phone, username, customFields = {}, contactManager = {} } = {}) {
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

		updateUser.$set.phone = (phone && [{ phoneNumber: phone }]) || null;

		updateUser.$set.visitorEmails = (email && [{ address: email }]) || null;

		const validCustomFields = {};

		Object.entries(customFields).forEach(([key, value]) => {
			if (value) {
				validCustomFields[key] = value;
			}
		});

		updateUser.$set.livechatData = (Object.keys(validCustomFields).length > 0 && validCustomFields) || null;

		updateUser.$set.contactManager = (contactManager?.username && { username: contactManager.username }) || null;

		LivechatVisitors.updateById(userId, updateUser);

		return userId;
	},
};
