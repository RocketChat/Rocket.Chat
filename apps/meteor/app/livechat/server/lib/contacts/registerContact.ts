import { MeteorError } from '@rocket.chat/core-services';
import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatVisitors, Users, LivechatRooms, LivechatInquiry, Rooms, Subscriptions } from '@rocket.chat/models';
import type { MatchKeysAndValues, OnlyFieldsOfType } from 'mongodb';

import { getAllowedCustomFields } from './getAllowedCustomFields';
import { validateCustomFields } from './validateCustomFields';
import { callbacks } from '../../../../../lib/callbacks';
import {
	notifyOnRoomChangedById,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnLivechatInquiryChangedByRoom,
} from '../../../../lib/server/lib/notifyListener';

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

export async function registerContact({
	token,
	name,
	email = '',
	phone,
	username,
	customFields = {},
	contactManager,
}: RegisterContactProps): Promise<string> {
	if (!token || typeof token !== 'string') {
		throw new MeteorError('error-invalid-contact-data', 'Invalid visitor token');
	}

	const visitorEmail = email.trim().toLowerCase();

	if (contactManager?.username) {
		// verify if the user exists with this username and has a livechat-agent role
		const manager = await Users.findOneByUsername(contactManager.username, { projection: { roles: 1 } });
		if (!manager) {
			throw new MeteorError('error-contact-manager-not-found', `No user found with username ${contactManager.username}`);
		}
		if (!manager.roles || !Array.isArray(manager.roles) || !manager.roles.includes('livechat-agent')) {
			throw new MeteorError('error-invalid-contact-manager', 'The contact manager must have the role "livechat-agent"');
		}
	}

	const existingUserByToken = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });
	let visitorId = existingUserByToken?._id;

	if (!existingUserByToken) {
		if (!username) {
			username = await LivechatVisitors.getNextVisitorUsername();
		}

		const existingUserByEmail = await LivechatVisitors.findOneGuestByEmailAddress(visitorEmail);
		visitorId = existingUserByEmail?._id;

		if (!existingUserByEmail) {
			const userData = {
				username,
				ts: new Date(),
				token,
			};

			visitorId = (await LivechatVisitors.insertOne(userData)).insertedId;
		}
	}

	const allowedCF = await getAllowedCustomFields();
	const livechatData: Record<string, string> = validateCustomFields(allowedCF, customFields, { ignoreAdditionalFields: true });

	const fieldsToRemove = {
		// if field is explicitely set to empty string, remove
		...(phone === '' && { phone: 1 }),
		...(visitorEmail === '' && { visitorEmails: 1 }),
		...(!contactManager?.username && { contactManager: 1 }),
	};

	const updateUser: { $set: MatchKeysAndValues<ILivechatVisitor>; $unset?: OnlyFieldsOfType<ILivechatVisitor> } = {
		$set: {
			token,
			name,
			livechatData,
			// if phone has some value, set
			...(phone && { phone: [{ phoneNumber: phone }] }),
			...(visitorEmail && { visitorEmails: [{ address: visitorEmail }] }),
			...(contactManager?.username && { contactManager: { username: contactManager.username } }),
		},
		...(Object.keys(fieldsToRemove).length && { $unset: fieldsToRemove }),
	};

	await LivechatVisitors.updateOne({ _id: visitorId }, updateUser);

	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
	const rooms: IOmnichannelRoom[] = await LivechatRooms.findByVisitorId(visitorId, {}, extraQuery).toArray();

	if (rooms?.length) {
		for await (const room of rooms) {
			const { _id: rid } = room;

			const responses = await Promise.all([
				Rooms.setFnameById(rid, name),
				LivechatInquiry.setNameByRoomId(rid, name),
				Subscriptions.updateDisplayNameByRoomId(rid, name),
			]);

			if (responses[0]?.modifiedCount) {
				void notifyOnRoomChangedById(rid);
			}

			if (responses[1]?.modifiedCount) {
				void notifyOnLivechatInquiryChangedByRoom(rid, 'updated', { name });
			}

			if (responses[2]?.modifiedCount) {
				void notifyOnSubscriptionChangedByRoomId(rid);
			}
		}
	}

	return visitorId as string;
}
