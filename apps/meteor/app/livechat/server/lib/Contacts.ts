import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import type { MatchKeysAndValues, OnlyFieldsOfType } from 'mongodb';
import { LivechatVisitors, Users, LivechatRooms, LivechatCustomField } from '@rocket.chat/models';
import type { ILivechatCustomField, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { Rooms, LivechatInquiry, Subscriptions } from '../../../models/server';

type RegisterContactProps = {
	_id?: string;
	token: string;
	name: string;
	username?: string;
	email?: string;
	phone?: string;
	customFields?: Record<string, unknown | string>;
	contactManager?: {
		username: string;
	};
};

export const Contacts = {
	async registerContact({
		token,
		name,
		email = '',
		phone,
		username,
		customFields = {},
		contactManager,
	}: RegisterContactProps): Promise<string> {
		check(token, String);

		const visitorEmail = s.trim(email).toLowerCase();

		if (contactManager?.username) {
			// verify if the user exists with this username and has a livechat-agent role
			const user = await Users.findOneByUsername(contactManager.username, { projection: { roles: 1 } });
			if (!user) {
				throw new Meteor.Error('error-contact-manager-not-found', `No user found with username ${contactManager.username}`);
			}
			if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('livechat-agent')) {
				throw new Meteor.Error('error-invalid-contact-manager', 'The contact manager must have the role "livechat-agent"');
			}
		}

		let contactId;

		const user = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (user) {
			contactId = user._id;
		} else {
			if (!username) {
				username = await LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (visitorEmail !== '' && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(visitorEmail))) {
				contactId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
					token,
				};

				contactId = (await LivechatVisitors.insertOne(userData)).insertedId;
			}
		}

		const allowedCF = await LivechatCustomField.findByScope<Pick<ILivechatCustomField, '_id'>>('visitor', { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();

		const livechatData = Object.keys(customFields)
			.filter((key) => allowedCF.includes(key) && customFields[key] !== '' && customFields[key] !== undefined)
			.reduce((obj: Record<string, unknown | string>, key) => {
				obj[key] = customFields[key];
				return obj;
			}, {});

		const updateUser: { $set: MatchKeysAndValues<ILivechatVisitor>; $unset?: OnlyFieldsOfType<ILivechatVisitor> } = {
			$set: {
				token,
				name,
				livechatData,
				...(phone && { phone: [{ phoneNumber: phone }] }),
				...(visitorEmail && { visitorEmails: [{ address: visitorEmail }] }),
				...(contactManager?.username && { contactManager: { username: contactManager.username } }),
			},
			...(!contactManager?.username && { $unset: { contactManager: 1 } }),
		};

		await LivechatVisitors.updateOne({ _id: contactId }, updateUser);

		const rooms: IOmnichannelRoom[] = await LivechatRooms.findByVisitorId(contactId, {}).toArray();

		rooms?.length &&
			rooms.forEach((room) => {
				const { _id: rid } = room;
				Rooms.setFnameById(rid, name) && LivechatInquiry.setNameByRoomId(rid, name) && Subscriptions.updateDisplayNameByRoomId(rid, name);
			});

		return contactId;
	},
};
