import { AppEvents, Apps } from '@rocket.chat/apps';
import type { ILivechatVisitor, IMessage, IOmnichannelRoomInfo, SelectedAgent, IOmnichannelRoomExtraData } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatContacts, Messages, LivechatCustomField, LivechatInquiry, Rooms, Subscriptions } from '@rocket.chat/models';

import { QueueManager } from './QueueManager';
import { Visitors } from './Visitors';
import { getRequiredDepartment } from './departmentsLib';
import { livechatLogger } from './logger';
import { callbacks } from '../../../../lib/callbacks';
import { trim } from '../../../../lib/utils/stringUtils';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import {
	notifyOnLivechatInquiryChangedByRoom,
	notifyOnSubscriptionChangedByRoomId,
	notifyOnRoomChangedById,
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
	livechatLogger.debug(`Attempting to find or create a room for visitor ${guest._id}`);
	const room = await LivechatRooms.findOneById(message.rid);

	if (room?.v._id && (await LivechatContacts.isChannelBlocked(Visitors.makeVisitorAssociation(room.v._id, room.source)))) {
		throw new Error('error-contact-channel-blocked');
	}

	if (!room?.open) {
		livechatLogger.debug(`Last room for visitor ${guest._id} closed. Creating new one`);
	}

	if (!room?.open) {
		return {
			room: await createRoom({ visitor: guest, message: message.msg, roomInfo, agent, extraData }),
			newRoom: true,
		};
	}

	if (room.v.token !== guest.token) {
		livechatLogger.debug(`Visitor ${guest._id} trying to access another visitor's room`);
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

	const defaultAgent = await callbacks.run('livechat.checkDefaultAgentOnNewRoom', agent, {
		visitorId: visitor._id,
		source: roomInfo.source,
	});

	// if no department selected verify if there is at least one active and pick the first
	if (!defaultAgent && !visitor.department) {
		const department = await getRequiredDepartment();
		livechatLogger.debug(`No department or default agent selected for ${visitor._id}`);

		if (department) {
			livechatLogger.debug(`Assigning ${visitor._id} to department ${department._id}`);
			visitor.department = department._id;
		}
	}

	// delegate room creation to QueueManager
	livechatLogger.debug(`Calling QueueManager to request a room for visitor ${visitor._id}`);

	const room = await QueueManager.requestRoom({
		guest: visitor,
		message,
		rid,
		roomInfo,
		agent: defaultAgent,
		extraData,
	});

	livechatLogger.debug(`Room obtained for visitor ${visitor._id} -> ${room._id}`);

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
			if (value !== '' && field.regexp !== undefined && field.regexp !== '') {
				const regexp = new RegExp(field.regexp);
				if (!regexp.test(value)) {
					throw new Meteor.Error(i18n.t('error-invalid-custom-field-value', { field: field.label }));
				}
			}
			customFields[field._id] = value;
		}
		roomData.livechatData = customFields;
		livechatLogger.debug(`About to update ${Object.keys(customFields).length} custom fields on room ${roomData._id}`);
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
