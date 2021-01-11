import { check } from 'meteor/check';
import s from 'underscore.string';

import {
	LivechatVisitors,
} from '../../../models';
import { findCustomFieldById } from '../api/lib/customFields';

export const Contacts = {

	registerContact({ token, name, email, phone, username, customFields = {}, contactManager = {} } = {}, userId) {
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

		const validCustomFields = {};

		Object.entries(customFields).forEach(([key, value]) => {
			if (value) {
				const { customField } = Promise.await(findCustomFieldById({ userId, customFieldId: key }));
				if (customField && customField.scope === 'visitor') {
					validCustomFields[key] = value;
				}
			}
		});

		updateUser.$set.livechatData = (Object.keys(validCustomFields).length > 0 && validCustomFields) || null;

		updateUser.$set.contactManager = (contactManager?.username && { username: contactManager.username }) || null;

		LivechatVisitors.updateById(contactId, updateUser);

		return contactId;
	},
};
