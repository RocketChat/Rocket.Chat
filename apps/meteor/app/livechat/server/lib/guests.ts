import { Apps, AppEvents } from '@rocket.chat/apps';
import type { ILivechatVisitor, IOmnichannelRoom, UserStatus } from '@rocket.chat/core-typings';
import {
	LivechatVisitors,
	LivechatCustomField,
	LivechatInquiry,
	LivechatRooms,
	Messages,
	ReadReceipts,
	Subscriptions,
	LivechatContacts,
	Users,
} from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import UAParser from 'ua-parser-js';

import { parseAgentCustomFields, validateEmail } from './Helper';
import type { RegisterGuestType } from './Visitors';
import { Visitors } from './Visitors';
import { ContactMerger, type FieldAndValue } from './contacts/ContactMerger';
import type { ICRMData } from './localTypes';
import { livechatLogger } from './logger';
import { trim } from '../../../../lib/utils/stringUtils';
import { i18n } from '../../../../server/lib/i18n';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { FileUpload } from '../../../file-upload/server';
import {
	notifyOnSubscriptionChanged,
	notifyOnLivechatInquiryChanged,
	notifyOnLivechatInquiryChangedByToken,
} from '../../../lib/server/lib/notifyListener';

export async function saveGuest(
	guestData: Pick<ILivechatVisitor, '_id' | 'name' | 'livechatData'> & { email?: string; phone?: string },
	userId: string,
) {
	const { _id, name, email, phone, livechatData = {} } = guestData;

	const visitor = await LivechatVisitors.findOneById(_id, { projection: { _id: 1 } });
	if (!visitor) {
		throw new Error('error-invalid-visitor');
	}

	livechatLogger.debug({ msg: 'Saving guest', guestData });
	const updateData: {
		name?: string | undefined;
		username?: string | undefined;
		email?: string | undefined;
		phone?: string | undefined;
		livechatData: {
			[k: string]: any;
		};
	} = { livechatData: {} };

	if (name) {
		updateData.name = name;
	}
	if (email) {
		updateData.email = email;
	}
	if (phone) {
		updateData.phone = phone;
	}

	const customFields: Record<string, any> = {};

	if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
		livechatLogger.debug({ msg: `Saving custom fields for visitor ${_id}`, livechatData });
		for await (const field of LivechatCustomField.findByScope('visitor')) {
			if (!livechatData.hasOwnProperty(field._id)) {
				continue;
			}
			const value = trim(livechatData[field._id]);
			if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
				const regexp = new RegExp(field.regexp);
				if (!regexp.test(value)) {
					throw new Error(i18n.t('error-invalid-custom-field-value'));
				}
			}
			customFields[field._id] = value;
		}
		updateData.livechatData = customFields;
		livechatLogger.debug(`About to update ${Object.keys(customFields).length} custom fields for visitor ${_id}`);
	}
	const ret = await LivechatVisitors.saveGuestById(_id, updateData);

	setImmediate(() => {
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatGuestSaved, _id);
	});

	return ret;
}

export async function removeGuest(_id: string) {
	const guest = await LivechatVisitors.findOneEnabledById(_id, { projection: { _id: 1, token: 1 } });
	if (!guest) {
		throw new Error('error-invalid-guest');
	}

	await cleanGuestHistory(guest.token);
	return LivechatVisitors.disableById(_id);
}

export async function registerGuest(newData: RegisterGuestType): Promise<ILivechatVisitor | null> {
	const visitor = await Visitors.registerGuest(newData);
	if (!visitor) {
		return null;
	}

	const { name, phone, email, username } = newData;

	const validatedEmail =
		email &&
		wrapExceptions(() => {
			const trimmedEmail = email.trim().toLowerCase();
			validateEmail(trimmedEmail);
			return trimmedEmail;
		}).suppress();

	const fields = [
		{ type: 'name', value: name },
		{ type: 'phone', value: phone?.number },
		{ type: 'email', value: validatedEmail },
		{ type: 'username', value: username || visitor.username },
	].filter((field) => Boolean(field.value)) as FieldAndValue[];

	if (!fields.length) {
		return null;
	}

	// If a visitor was updated who already had contacts, load up the contacts and update that information as well
	const contacts = await LivechatContacts.findAllByVisitorId(visitor._id).toArray();
	for await (const contact of contacts) {
		await ContactMerger.mergeFieldsIntoContact({
			fields,
			contact,
			conflictHandlingMode: contact.unknown ? 'overwrite' : 'conflict',
		});
	}

	return visitor;
}

async function cleanGuestHistory(token: string) {
	// This shouldn't be possible, but just in case
	if (!token) {
		throw new Error('error-invalid-guest');
	}

	const cursor = LivechatRooms.findByVisitorToken(token);
	for await (const room of cursor) {
		await Promise.all([
			Subscriptions.removeByRoomId(room._id, {
				async onTrash(doc) {
					void notifyOnSubscriptionChanged(doc, 'removed');
				},
			}),
			FileUpload.removeFilesByRoomId(room._id),
			Messages.removeByRoomId(room._id),
			ReadReceipts.removeByRoomId(room._id),
		]);
	}

	await LivechatRooms.removeByVisitorToken(token);

	const livechatInquiries = await LivechatInquiry.findIdsByVisitorToken(token).toArray();
	await LivechatInquiry.removeByIds(livechatInquiries.map(({ _id }) => _id));
	void notifyOnLivechatInquiryChanged(livechatInquiries, 'removed');
}

export async function getLivechatRoomGuestInfo(room: IOmnichannelRoom) {
	const visitor = await LivechatVisitors.findOneEnabledById(room.v._id);
	if (!visitor) {
		throw new Error('error-invalid-visitor');
	}

	const agent = room.servedBy?._id ? await Users.findOneById(room.servedBy?._id) : null;

	const ua = new UAParser();
	ua.setUA(visitor.userAgent || '');

	const postData: ICRMData = {
		_id: room._id,
		label: room.fname || room.label, // using same field for compatibility
		topic: room.topic,
		createdAt: room.ts,
		lastMessageAt: room.lm,
		tags: room.tags,
		customFields: room.livechatData,
		visitor: {
			_id: visitor._id,
			token: visitor.token,
			name: visitor.name,
			username: visitor.username,
			department: visitor.department,
			ip: visitor.ip,
			os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
			browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
			customFields: visitor.livechatData,
		},
	};

	if (agent) {
		const customFields = parseAgentCustomFields(agent.customFields);

		postData.agent = {
			_id: agent._id,
			username: agent.username,
			name: agent.name,
			...(customFields && { customFields }),
		};

		if (agent.emails && agent.emails.length > 0) {
			postData.agent.email = agent.emails[0].address;
		}
	}

	if (room.crmData) {
		postData.crmData = room.crmData;
	}

	if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
		postData.visitor.email = visitor.visitorEmails;
	}
	if (visitor.phone && visitor.phone.length > 0) {
		postData.visitor.phone = visitor.phone;
	}

	return postData;
}

export async function notifyGuestStatusChanged(token: string, status: UserStatus) {
	// TODO: a promise.all maybe?
	await LivechatRooms.updateVisitorStatus(token, status);

	const inquiryVisitorStatus = await LivechatInquiry.updateVisitorStatus(token, status);

	if (inquiryVisitorStatus.modifiedCount) {
		void notifyOnLivechatInquiryChangedByToken(token, 'updated', { v: { status } });
	}
}
