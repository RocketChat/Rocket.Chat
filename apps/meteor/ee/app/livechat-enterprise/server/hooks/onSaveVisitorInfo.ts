import type { IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { removePriorityFromRoom, updateRoomPriority } from '../api/lib/priorities';
import { removeRoomSLA, updateRoomSLA } from '../api/lib/sla';
import { cbLogger } from '../lib/logger';

const updateSLA = async (room: IOmnichannelRoom, user: IUser, slaId?: string) => {
	if (!slaId) {
		await removeRoomSLA(room._id, user);
		return;
	}

	const sla = await OmnichannelServiceLevelAgreements.findOneById(slaId);
	if (!sla) {
		throw new Error(`SLA not found with id: ${slaId}`);
	}

	await updateRoomSLA(room._id, user, sla);
};

const updatePriority = async (room: IOmnichannelRoom, user: IUser, priorityId?: string) => {
	if (!priorityId) {
		await removePriorityFromRoom(room._id, user);
		return;
	}

	await updateRoomPriority(room._id, user, priorityId);
};

const saveInfo = async (room: IOmnichannelRoom, { user, oldRoom }: { user: IUser; oldRoom: IOmnichannelRoom }) => {
	if (!room || !user) {
		return room;
	}

	const { slaId: oldSlaId, priorityId: oldPriorityId } = oldRoom;
	const { slaId: newSlaId, priorityId: newPriorityId } = room;

	if (oldSlaId === newSlaId && oldPriorityId === newPriorityId) {
		cbLogger.debug('No changes in SLA or Priority');
		return room;
	}
	if (oldSlaId === newSlaId && oldPriorityId !== newPriorityId) {
		cbLogger.debug(`Updating Priority for room ${room._id}, from ${oldPriorityId} to ${newPriorityId}`);
		await updatePriority(room, user, newPriorityId);
	} else if (oldSlaId !== newSlaId && oldPriorityId === newPriorityId) {
		cbLogger.debug(`Updating SLA for room ${room._id}, from ${oldSlaId} to ${newSlaId}`);
		await updateSLA(room, user, newSlaId);
	} else {
		cbLogger.debug(
			`Updating SLA and Priority for room ${room._id}, from ${oldSlaId} to ${newSlaId} and from ${oldPriorityId} to ${newPriorityId}`,
		);
		await Promise.all([updateSLA(room, user, newSlaId), updatePriority(room, user, newPriorityId)]);
	}

	return room;
};

callbacks.add(
	'livechat.saveInfo',
	(room, { user, oldRoom }) => Promise.await(saveInfo(room, { user, oldRoom })),
	callbacks.priority.HIGH,
	'livechat-on-save-room-info',
);
