import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { LivechatVisitors, LivechatCustomField, LivechatRooms, Rooms, LivechatInquiry, Subscriptions } from '../../../models';
import { Users } from '../../../models/server/raw';

export const Contacts = {
	registerContact({ token, name, email, phone, username, customFields = {}, contactManager = {} } = {}) {
		check(token, String);

		const visitorEmail = s.trim(email).toLowerCase();

		if (contactManager?.username) {
			// verify if the user exists with this username and has a livechat-agent role
			const user = Promise.await(Users.findOneByUsername(contactManager.username, { projection: { roles: 1 } }));
			if (!user) {
				throw new Meteor.Error('error-contact-manager-not-found', `No user found with username ${contactManager.username}`);
			}
			if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('livechat-agent')) {
				throw new Meteor.Error('error-invalid-contact-manager', 'The contact manager must have the role "livechat-agent"');
			}
		}

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

			if (visitorEmail !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(visitorEmail))) {
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
		updateUser.$set.visitorEmails = (visitorEmail && [{ address: visitorEmail }]) || null;

		const allowedCF = LivechatCustomField.find({ scope: 'visitor' }, { fields: { _id: 1 } }).map(({ _id }) => _id);

		const livechatData = Object.keys(customFields)
			.filter((key) => allowedCF.includes(key) && customFields[key] !== '' && customFields[key] !== undefined)
			.reduce((obj, key) => {
				obj[key] = customFields[key];
				return obj;
			}, {});

		updateUser.$set.livechatData = livechatData;
		updateUser.$set.contactManager = (contactManager?.username && { username: contactManager.username }) || null;

		LivechatVisitors.updateById(contactId, updateUser);

		const rooms = LivechatRooms.findByVisitorId(contactId).fetch();

		rooms?.length &&
			rooms.forEach((room) => {
				const { _id: rid } = room;
				Rooms.setFnameById(rid, name) && LivechatInquiry.setNameByRoomId(rid, name) && Subscriptions.updateDisplayNameByRoomId(rid, name);
			});

		return contactId;
	},
};
