import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatInquiry, LivechatPriority, LivechatRooms } from '@rocket.chat/models';
import type { ILivechatPriority } from '@rocket.chat/core-typings';
import type { FindOptions, UpdateFilter } from 'mongodb';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import { logger } from '../../lib/logger';

type FindPriorityParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<ILivechatPriority>['sort'];
	};
};

export async function findPriority({
	text,
	pagination: { offset, count, sort },
}: FindPriorityParams): Promise<PaginatedResult<{ priorities: ILivechatPriority[] }>> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await LivechatPriority.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [priorities, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		priorities,
		count: priorities.length,
		offset,
		total,
	};
}

export async function updatePriority(
	_id: string,
	data: Pick<ILivechatPriority, 'name'> & { reset?: boolean },
): Promise<ILivechatPriority | null> {
	const query = {
		_id,
	};
	const update: Pick<UpdateFilter<ILivechatPriority>, '$set' | '$unset'> = {
		...((data.reset && {
			$set: { dirty: false },
			$unset: { name: 1 },
		}) || {
			// Trim value before inserting
			$set: { name: data.name?.trim(), dirty: true },
		}),
	};

	if (data.name) {
		// If we want to enforce translated duplicates we need to change this
		const priority = await LivechatPriority.findOne({ name: new RegExp(`^${escapeRegExp(data.name.trim())}$`, 'i') });
		if (priority && priority._id !== _id) {
			throw new Error('error-duplicate-priority-name');
		}
	}

	const createdResult = await LivechatPriority.findOneAndUpdate(query, update, {
		returnDocument: 'after',
	});

	if (!createdResult.ok || !createdResult.value) {
		logger.error(`Error updating priority: ${_id}. Unsuccessful result from mongodb. Result`, createdResult);
		throw Error('error-unable-to-update-priority');
	}

	return createdResult.value;
}

export const updateRoomPriority = async (rid: string, priorityId: string): Promise<void> => {
	const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1 } });
	if (!room) {
		throw new Error('error-room-does-not-exist');
	}

	const priority: Pick<ILivechatPriority, '_id' | 'sortItem'> | null = await LivechatPriority.findOneById(priorityId, {
		projection: { _id: 1, sortItem: 1 },
	});
	if (!priority) {
		throw new Error('error-invalid-priority');
	}

	await Promise.all([LivechatRooms.setPriorityByRoomId(rid, priority), LivechatInquiry.setPriorityForRoom(rid, priority)]);
};

export const removePriorityFromRoom = async (rid: string): Promise<void> => {
	const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1, priorityId: 1, priorityWeight: 1 } });
	if (!room) {
		throw new Error('error-room-does-not-exist');
	}

	if (!room.priorityId || !room.priorityWeight) {
		logger.debug(`Room ${rid} does not have a priority set. Skipping.`);
		return;
	}

	await Promise.all([LivechatRooms.unsetPriorityByRoomId(rid), LivechatInquiry.unsetPriorityForRoom(rid)]);
};
