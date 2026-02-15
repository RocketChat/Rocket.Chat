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
	livechatLogger.debug({ msg: 'Attempting to find or create a room for visitor', visitorId: guest._id });
	const room = await LivechatRooms.findOneById(message.rid);

	if (room?.v._id && (await LivechatContacts.isChannelBlocked(Visitors.makeVisitorAssociation(room.v._id, room.source)))) {
		throw new Error('error-contact-channel-blocked');
	}

	if (!room?.open) {
		livechatLogger.debug({ msg: 'Last room for visitor closed. Creating new one', visitorId: guest._id });
	}

	if (!room?.open) {
		return {
			room: await createRoom({ visitor: guest, message: message.msg, roomInfo, agent, extraData }),
			newRoom: true,
		};
	}

	if (room.v.token !== guest.token) {
		livechatLogger.debug({ msg: 'Visitor trying to access another visitor room', visitorId: guest._id });
		throw new Meteor.Error('cannot-access-room');
	}

	return { room, newRoom: false };
}

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

	const defaultAgent = await checkDefaultAgentOnNewRoom(agent, {
		visitorId: visitor._id,
		source: roomInfo.source,
	});

	// if no department selected verify if there is at least one active and pick the first
	if (!defaultAgent && !visitor.department) {
		const department = await getRequiredDepartment();
		livechatLogger.debug({ msg: 'No department or default agent selected for visitor', visitorId: visitor._id });

		if (department) {
			livechatLogger.debug({ msg: 'Assigning visitor to department', visitorId: visitor._id, departmentId: department._id });
			visitor.department = department._id;
		}
	}

	// delegate room creation to QueueManager
	livechatLogger.debug({ msg: 'Calling QueueManager to request a room for visitor', visitorId: visitor._id });

	const room = await QueueManager.requestRoom({
		guest: visitor,
		message,
		rid,
		roomInfo,
		agent: defaultAgent,
		extraData,
	});

	livechatLogger.debug({ msg: 'Room obtained for visitor', visitorId: visitor._id, roomId: room._id });

	await Messages.setRoomIdByToken(visitor.token, room._id);

	return room;
}

export async function saveRoomInfo(
	roomData: {
		_id: string;
		topic?: string;
		tags?: string[];
		livechatData?: { [k: string]: string };
		// For priority and SLA, if the value is blank (ie ""), then system will remove the priority or SLA from the room
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
	livechatLogger.debug({ msg: 'Saving room information', roomId: roomData._id });
	const { livechatData = {} } = roomData;
	const customFields: Record<string, string> = {};

	if ((!userId || (await hasPermissionAsync(userId, 'edit-livechat-room-customfields'))) && Object.keys(livechatData).length) {
		const fields = LivechatCustomField.findByScope('room');
		for await (const field of fields) {
			if (!livechatData.hasOwnProperty(field._id)) {
				continue;
			}
			const value = trim(livechatData[field._id]);
			if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
				const regexp = new RegExp(field.regexp);
				if (!regexp.test(value)) {
					throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: field.label }));
				}
			}
			customFields[field._id] = value;
		}
		roomData.livechatData = customFields;
		livechatLogger.debug({
			msg: 'About to update custom fields on room',
			roomId: roomData._id,
			customFieldCount: Object.keys(customFields).length,
		});
	}

	await LivechatRooms.saveRoomById(roomData);

	setImmediate(() => {
		void Apps.self?.triggerEvent(AppEvents.IPostLivechatRoomSaved, roomData._id);
	});

	if (guestData?.name?.trim().length) {
		const { _id: rid } = roomData;
		const { name } = guestData;

		const responses = await Promise.all([
			Rooms.setFnameById(rid, name),
			LivechatInquiry.setNameByRoomId(rid, name),
			Subscriptions.updateDisplayNameByRoomId(rid, name),
		]);

		if (responses[1]?.modifiedCount) {
			void notifyOnLivechatInquiryChangedByRoom(rid, 'updated', { name });
		}

		if (responses[2]?.modifiedCount) {
			await notifyOnSubscriptionChangedByRoomId(rid);
		}
	}

	void notifyOnRoomChangedById(roomData._id);

	return true;
}

export async function returnRoomAsInquiry(room: IOmnichannelRoom, departmentId?: string, overrideTransferData: Partial<TransferData> = {}) {
	livechatLogger.debug({ msg: 'Transferring room to queue', scope: departmentId ? 'department' : undefined, room });
	if (!room.open) {
		throw new Meteor.Error('room-closed', 'Room closed');
	}

	if (room.onHold) {
		throw new Meteor.Error('error-room-onHold');
	}

	if (!(await Omnichannel.isWithinMACLimit(room))) {
		throw new Meteor.Error('error-mac-limit-reached');
	}

	if (!room.servedBy) {
		return false;
	}

	const user = await Users.findOneById(room.servedBy._id);
	if (!user?._id) {
		throw new Meteor.Error('error-invalid-user');
	}

	const inquiry = await LivechatInquiry.findOne({ rid: room._id });
	if (!inquiry) {
		return false;
	}

	// update inquiry's last message with room's last message to correctly display in the queue
	// because we stop updating the inquiry when it's been taken
	if (room.lastMessage) {
		await LivechatInquiry.setLastMessageById(inquiry._id, room.lastMessage);
	}

	const transferredBy = normalizeTransferredByData(user, room);
	livechatLogger.debug({ msg: 'Transferring room by user', roomId: room._id, transferredBy: transferredBy._id });
	const transferData = { scope: 'queue' as const, departmentId, transferredBy, ...overrideTransferData };
	try {
		await saveTransferHistory(room, transferData);
		await RoutingManager.unassignAgent(inquiry, departmentId);
	} catch (err) {
		livechatLogger.error({ err });
		throw new Meteor.Error('error-returning-inquiry');
	}

	callbacks.runAsync('livechat:afterReturnRoomAsInquiry', { room });

	return true;
}

export async function removeOmnichannelRoom(rid: string) {
	livechatLogger.debug({ msg: 'Deleting room', roomId: rid });
	check(rid, String);
	const room = await LivechatRooms.findOneById(rid);
	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room');
	}

	if (!isOmnichannelRoom(room)) {
		throw new Meteor.Error('error-this-is-not-a-livechat-room');
	}

	if (room.open) {
		throw new Meteor.Error('error-room-is-not-closed');
	}

	const inquiry = await LivechatInquiry.findOneByRoomId(rid);

	const result = await Promise.allSettled([
		Messages.removeByRoomId(rid),
		ReadReceipts.removeByRoomId(rid),
		Subscriptions.removeByRoomId(rid, {
			async onTrash(doc) {
				void notifyOnSubscriptionChanged(doc, 'removed');
			},
		}),
		LivechatInquiry.removeByRoomId(rid),
		LivechatRooms.removeById(rid),
	]);

	if (result[3]?.status === 'fulfilled' && result[3].value?.deletedCount && inquiry) {
		void notifyOnLivechatInquiryChanged(inquiry, 'removed');
	}
	if (result[4]?.status === 'fulfilled' && result[4].value?.deletedCount) {
		void notifyOnRoomChanged(room, 'removed');
	}

	for (const r of result) {
		if (r.status === 'rejected') {
			livechatLogger.error({ msg: 'Error removing room', roomId: rid, err: r.reason });
			throw new Meteor.Error('error-removing-room', 'Error removing room');
		}
	}
}
