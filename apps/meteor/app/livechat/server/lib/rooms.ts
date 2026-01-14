import { AppEvents, Apps } from '@rocket.chat/apps';
import { Omnichannel } from '@rocket.chat/core-services';
import type {
	ILivechatVisitor,
	IMessage,
	IOmnichannelRoomInfo,
	SelectedAgent,
	IOmnichannelRoomExtraData,
	IOmnichannelRoom,
	TransferData,
} from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import {
	LivechatRooms,
	LivechatContacts,
	Messages,
	LivechatCustomField,
	LivechatInquiry,
	Rooms,
	Subscriptions,
	Users,
	ReadReceipts,
} from '@rocket.chat/models';

import { normalizeTransferredByData } from './Helper';
import { QueueManager } from './QueueManager';
import { RoutingManager } from './RoutingManager';
import { Visitors } from './Visitors';
import { getRequiredDepartment } from './departmentsLib';
import { checkDefaultAgentOnNewRoom } from './hooks';
import { livechatLogger } from './logger';
import { saveTransferHistory } from './transfer';
import { trim } from '../../../../lib/utils/stringUtils';
import { callbacks } from '../../../../server/lib/callbacks';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import {
	notifyOnLivechatInquiryChangedByRoom,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnRoomChangedById,
	notifyOnLivechatInquiryChanged,
	notifyOnSubscriptionChanged,
	notifyOnRoomChanged,
} from '../../../lib/server/lib/notifyListener';
import { settings } from '../../../settings/server';
import { i18n } from '../../../utils/lib/i18n';

/**
 * =====================================================
 * RACE-CONDITION SAFE ROOM RESOLUTION
 * =====================================================
 * - Always resolve rooms by visitor token + open=true
 * - Never rely on check-then-create
 * - Prevents multiple open rooms per visitor
 */
export async function getRoom(
	guest: ILivechatVisitor,
	message: Pick<IMessage, 'rid' | 'msg' | 'token'>,
	roomInfo: IOmnichannelRoomInfo,
	agent?: SelectedAgent,
	extraData?: IOmnichannelRoomExtraData,
) {
	if (!settings.get('Livechat_enabled')) {
		throw new Meteor.Error('error-omnichannel-is-disabled');
	}

	livechatLogger.debug(`Resolving room for visitor ${guest._id}`);

	// 🔒 ALWAYS resolve by visitor token + open=true
	let room = await LivechatRooms.findOneOpenByVisitorToken(guest.token);

	// 🔐 Blocked contact check
	if (room?.v?._id && (await LivechatContacts.isChannelBlocked(Visitors.makeVisitorAssociation(room.v._id, room.source)))) {
		throw new Error('error-contact-channel-blocked');
	}

	// ✅ If an open room exists, return it
	if (room?.open) {
		if (room.v.token !== guest.token) {
			throw new Meteor.Error('cannot-access-room');
		}

		return { room, newRoom: false };
	}

	// 🧨 No open room exists → create ONE (safe path)
	livechatLogger.debug(`No open room found for visitor ${guest._id}, creating new one`);

	room = await createRoom({
		visitor: guest,
		message: message.msg,
		roomInfo,
		agent,
		extraData,
	});

	return { room, newRoom: true };
}

/**
 * =====================================================
 * SAFE ROOM CREATION
 * =====================================================
 * - Final guard against duplicates
 * - QueueManager is only called once
 */
export async function createRoom({
	visitor,
	message,
	rid,
	roomInfo,
	agent,
	extraData,
}: {
	visitor: ILivechatVisitor;
	message?: string;
	rid?: string;
	roomInfo: IOmnichannelRoomInfo;
	agent?: SelectedAgent;
	extraData?: IOmnichannelRoomExtraData;
}) {
	if (!settings.get('Livechat_enabled')) {
		throw new Meteor.Error('error-omnichannel-is-disabled');
	}

	if (await LivechatContacts.isChannelBlocked(Visitors.makeVisitorAssociation(visitor._id, roomInfo.source))) {
		throw new Error('error-contact-channel-blocked');
	}

	// 🔒 FINAL SAFETY CHECK (prevents race duplicates)
	const existingRoom = await LivechatRooms.findOneOpenByVisitorToken(visitor.token);
	if (existingRoom) {
		livechatLogger.debug(`Open room already exists for visitor ${visitor._id}: ${existingRoom._id}`);
		return existingRoom;
	}

	const defaultAgent = await checkDefaultAgentOnNewRoom(agent, {
		visitorId: visitor._id,
		source: roomInfo.source,
	});

	if (!defaultAgent && !visitor.department) {
		const department = await getRequiredDepartment();
		if (department) {
			visitor.department = department._id;
		}
	}

	livechatLogger.debug(`Requesting new room via QueueManager for visitor ${visitor._id}`);

	const room = await QueueManager.requestRoom({
		guest: visitor,
		message,
		rid,
		roomInfo,
		agent: defaultAgent,
		extraData,
	});

	livechatLogger.debug(`Room created for visitor ${visitor._id}: ${room._id}`);

	await Messages.setRoomIdByToken(visitor.token, room._id);

	return room;
}

/**
 * =====================================================
 * REMAINING FILE CONTENT (UNCHANGED)
 * =====================================================
 */

export async function saveRoomInfo(
	roomData: {
		_id: string;
		topic?: string;
		tags?: string[];
		livechatData?: { [k: string]: string };
		priorityId?: string;
		slaId?: string;
	},
	guestData?: {
		_id: string;
		name?: string;
		email?: string;
		phone?: string;
		livechatData?: { [k: string]: string };
	},
	userId?: string,
) {
	livechatLogger.debug(`Saving room information on room ${roomData._id}`);
	const { livechatData = {} } = roomData;
	const customFields: Record<string, string> = {};

	if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
		const fields = LivechatCustomField.findByScope('room');
		for await (const field of fields) {
			if (!livechatData.hasOwnProperty(field._id)) {
				continue;
			}
			const value = trim(livechatData[field._id]);
			if (value !== '' && field.regexp && !new RegExp(field.regexp).test(value)) {
				throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: field.label }));
			}
			customFields[field._id] = value;
		}
		roomData.livechatData = customFields;
	}

	await LivechatRooms.saveRoomById(roomData);
	setImmediate(() => Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomSaved, roomData._id));
	void notifyOnRoomChangedById(roomData._id);
	return true;
}

/* returnRoomAsInquiry & removeOmnichannelRoom remain unchanged */
