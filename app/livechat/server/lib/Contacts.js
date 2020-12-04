import _ from 'underscore';

import {
	LivechatVisitors,
} from '../../../models';


export const Contacts = {
	saveContact({ _id, name, email, phone } = {}) {
		let contactId;
		let username;
		const updateUser = {
			$set: {
				name,
			},
			$unset: { },
		};

		const contact = LivechatVisitors.findOneById(_id);

		if (contact) {
			contactId = contact._id;
		} else {
			username = LivechatVisitors.getNextVisitorUsername();

			const userData = {
				username,
			};

			contactId = LivechatVisitors.insert(userData);
		}

		if (phone) {
			updateUser.$set.phone = [
				{ phoneNumber: phone.number },
			];
		} else {
			updateUser.$unset.phone = 1;
		}

		if (email && email.trim() !== '') {
			updateUser.$set.visitorEmails = [
				{ address: email },
			];
		} else {
			updateUser.$unset.visitorEmails = 1;
		}

		if (_.isEmpty(updateUser.$unset)) { delete updateUser.$unset; }

		LivechatVisitors.updateById(contactId, updateUser);

		const contactUpdated = LivechatVisitors.findOneById(contactId);

		return contactUpdated;
	},
	findContactInfo(contactId) {
		const contact = LivechatVisitors.findOneById(contactId);
		if (!contact) {
			throw new Error('contact-not-found');
		}

		return {
			contact,
		};
	},
};
