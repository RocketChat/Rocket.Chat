import { ILivechatCustomField, ILivechatVisitor, ILivechatVisitorDTO, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { check } from 'meteor/check';
import { UpdateQuery } from 'mongodb';

import { LivechatVisitors, LivechatCustomField, LivechatRooms, Rooms, LivechatInquiry, Subscriptions } from '../../../models/server';

const getTypedKeys = Object.keys as <T extends object>(obj: T) => Array<keyof T>;

export const Contacts = {
	registerContact({
		token,
		name,
		email,
		phone,
		username,
		customFields = {},
		contactManager,
	}: Pick<ILivechatVisitorDTO, 'token' | 'name' | 'email' | 'username'> & {
		customFields?: Record<string, unknown>;
		contactManager?: ILivechatVisitor['contactManager'];
		phone?: string;
	}): string {
		check(token, String);

		const visitorEmail = email?.trim().toLowerCase();

		let contactId;

		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (user) {
			contactId = user._id;
		} else {
			if (!username) {
				username = LivechatVisitors.getNextVisitorUsername();
			}

			let existingUser = null;

			if (visitorEmail && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(visitorEmail))) {
				contactId = existingUser._id;
			} else {
				const userData = {
					username,
					ts: new Date(),
				};

				contactId = LivechatVisitors.insert(userData);
			}
		}

		const allowedCF = (LivechatCustomField.find({ scope: 'visitor' }, { fields: { _id: 1 } }) as ILivechatCustomField[]).map(
			({ _id }) => _id,
		);

		const livechatData = getTypedKeys(customFields)
			.filter((key) => allowedCF.includes(key) && customFields[key] !== '' && customFields[key] !== undefined)
			.reduce((obj, key) => {
				obj[key] = customFields[key];
				return obj;
			}, {} as Record<string, unknown>);

		const updateUser: UpdateQuery<ILivechatVisitor> = {
			$set: {
				token,
				name,
				...(phone && { phone: [{ phoneNumber: phone }] }),
				...(visitorEmail && { visitorEmails: [{ address: visitorEmail }] }),
				livechatData,
				...(contactManager?.username && { contactManager: { username: contactManager.username } }),
			},
		};

		LivechatVisitors.updateById(contactId, updateUser);

		const rooms: IOmnichannelRoom[] = LivechatRooms.findByVisitorId(contactId).fetch();

		rooms?.length &&
			rooms.forEach((room) => {
				const { _id: rid } = room;
				Rooms.setFnameById(rid, name) && LivechatInquiry.setNameByRoomId(rid, name) && Subscriptions.updateDisplayNameByRoomId(rid, name);
			});

		return contactId;
	},
};
