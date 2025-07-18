import { Message } from '@rocket.chat/core-services';
import type { IOmnichannelServiceLevelAgreements, IUser } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import {
	notifyOnLivechatInquiryChanged,
	notifyOnRoomChangedById,
	notifyOnLivechatInquiryChangedByRoom,
} from '../../../../../app/lib/server/lib/notifyListener';
import { callbacks } from '../../../../../lib/callbacks';

export const removeSLAFromRooms = async (slaId: string, userId: string) => {
	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId });
	const openRooms = await LivechatRooms.findOpenBySlaId(slaId, { projection: { _id: 1 } }, extraQuery).toArray();
	const openRoomIds: string[] = openRooms.map(({ _id }) => _id);
	if (openRooms.length) {
		await LivechatInquiry.bulkUnsetSla(openRoomIds);
		void notifyOnLivechatInquiryChangedByRoom(openRoomIds, 'updated');
	}

	await LivechatRooms.bulkRemoveSlaFromRoomsById(slaId);
	void notifyOnRoomChangedById(openRoomIds, 'updated');
};

export const updateInquiryQueueSla = async (roomId: string, sla: Pick<IOmnichannelServiceLevelAgreements, 'dueTimeInMinutes' | '_id'>) => {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { rid: 1, ts: 1 } });
	if (!inquiry) {
		return;
	}

	const { dueTimeInMinutes, _id: slaId } = sla;

	const estimatedWaitingTimeQueue = dueTimeInMinutes;

	await LivechatInquiry.setSlaForRoom(inquiry.rid, {
		slaId,
		estimatedWaitingTimeQueue,
	});

	void notifyOnLivechatInquiryChanged({ ...inquiry, slaId, estimatedWaitingTimeQueue }, 'updated');
};

export const updateRoomSlaWeights = async (roomId: string, sla: Pick<IOmnichannelServiceLevelAgreements, 'dueTimeInMinutes' | '_id'>) => {
	await LivechatRooms.setSlaForRoomById(roomId, sla);
};

export const removeInquiryQueueSla = async (roomId: string) => {
	await LivechatInquiry.unsetSlaForRoom(roomId);
};

export const removeSlaFromRoom = async (roomId: string) => {
	await LivechatRooms.removeSlaFromRoomById(roomId);
};

export const addSlaChangeHistoryToRoom = async (
	roomId: string,
	user: Pick<IUser, '_id' | 'name' | 'username'>,
	sla?: Pick<IOmnichannelServiceLevelAgreements, 'name'>,
) => {
	await Message.saveSystemMessage('omnichannel_sla_change_history', roomId, '', user, {
		slaData: {
			definedBy: {
				_id: user._id,
				username: user.username,
			},
			...(sla && { sla }),
		},
	});
};
