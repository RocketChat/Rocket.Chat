import type { IOmnichannelRoom, IOmnichannelServiceLevelAgreements, IUser } from '@rocket.chat/core-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { removePriorityFromRoom, updateRoomPriority } from '../api/lib/priorities';
import { removeRoomSLA, updateRoomSLA } from '../api/lib/sla';
import { cbLogger } from '../lib/logger';

const updateSLA = async (room: IOmnichannelRoom, user: Required<Pick<IUser, '_id' | 'username' | 'name'>>, slaId?: string) => {
	if (!slaId) {
		return removeRoomSLA(room._id, user);
	}

	const sla: Pick<IOmnichannelServiceLevelAgreements, '_id' | 'name' | 'dueTimeInMinutes'> | null =
		await OmnichannelServiceLevelAgreements.findOneById(slaId, {
			projection: { _id: 1, name: 1, dueTimeInMinutes: 1 },
		});
	if (!sla) {
		throw new Error(`SLA not found with id: ${slaId}`);
	}

	await updateRoomSLA(room._id, user, sla);
};

const updatePriority = async (room: IOmnichannelRoom, user: Required<Pick<IUser, '_id' | 'username' | 'name'>>, priorityId?: string) => {
	if (!priorityId) {
		return removePriorityFromRoom(room._id, user);
	}

	await updateRoomPriority(room._id, user, priorityId);
};

callbacks.add(
	'livechat.saveInfo',
	async (room, { user, oldRoom }: any) => {
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

		return room as any;
	},
	callbacks.priority.HIGH,
	'livechat-on-save-room-info',
);
