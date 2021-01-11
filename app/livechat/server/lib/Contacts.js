import { check } from 'meteor/check';
import s from 'underscore.string';

import {
	LivechatVisitors,
	LivechatCustomField,
} from '../../../models';


export const Contacts = {

	registerContact({ token, name, email, phone, username, customFields = {}, contactManager = {} } = {}) {
		check(token, String);

		let contactId;
		const updateUser = {
			$set: {
				token,
			},
		};

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			contactId = user._id;
		} else {
			if (!username) {
				username = LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
				contactId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
				};

				contactId = LivechatVisitors.insert(userData);
			}
		}

		updateUser.$set.name = name;
		updateUser.$set.phone = (phone && [{ phoneNumber: phone }]) || null;
		updateUser.$set.visitorEmails = (email && [{ address: email }]) || null;

		const allowedCF = LivechatCustomField.find({ scope: 'visitor' }).map(({ _id }) => _id);

		const livechatData = Object.keys(customFields)
			.filter((key) => allowedCF.includes(key) && customFields[key] !== '' && customFields[key] !== undefined)
			.reduce((obj, key) => {
				obj[key] = customFields[key];
				return obj;
			}, {});

		updateUser.$set.livechatData = livechatData;
		updateUser.$set.contactManager = (contactManager?.username && { username: contactManager.username }) || null;

		LivechatVisitors.updateById(contactId, updateUser);

		return contactId;
	},
};
