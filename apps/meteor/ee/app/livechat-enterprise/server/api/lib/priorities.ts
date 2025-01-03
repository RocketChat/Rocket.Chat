import { Message } from '@rocket.chat/core-services';
import type { ILivechatPriority, IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatPriority, LivechatRooms } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { FindOptions } from 'mongodb';

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

export async function updatePriority(_id: string, data: Pick<ILivechatPriority, 'name'> & { reset?: boolean }): Promise<ILivechatPriority> {
	if (data.name) {
		// If we want to enforce translated duplicates we need to change this
		const priority = await LivechatPriority.findOneNameUsingRegex(data.name, { projection: { name: 1 } });
		if (priority && priority._id !== _id) {
			throw new Error('error-duplicate-priority-name');
		}
	}

	const createdResult = await LivechatPriority.updatePriority(_id, data.reset || false, data.name);

	if (!createdResult) {
		logger.error(`Error updating priority: ${_id}. Unsuccessful result from mongodb. Result`, createdResult);
		throw Error('error-unable-to-update-priority');
	}

	return createdResult;
}

export const updateRoomPriority = async (
	rid: string,
	user: Required<Pick<IUser, '_id' | 'username' | 'name'>>,
	priorityId: string,
): Promise<void> => {
	const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1 } });
	if (!room) {
		throw new Error('error-room-does-not-exist');
	}

	const priority = await LivechatPriority.findOneById(priorityId);
	if (!priority) {
		throw new Error('error-invalid-priority');
	}

	await Promise.all([
		LivechatRooms.setPriorityByRoomId(rid, priority),
		LivechatInquiry.setPriorityForRoom(rid, priority),
		addPriorityChangeHistoryToRoom(room._id, user, priority),
	]);
};

export const removePriorityFromRoom = async (rid: string, user: Required<Pick<IUser, '_id' | 'username' | 'name'>>): Promise<void> => {
	const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id'>>(rid, { projection: { _id: 1 } });
	if (!room) {
		throw new Error('error-room-does-not-exist');
	}

	await Promise.all([
		LivechatRooms.unsetPriorityByRoomId(rid),
		LivechatInquiry.unsetPriorityForRoom(rid),
		addPriorityChangeHistoryToRoom(rid, user),
	]);
};

const addPriorityChangeHistoryToRoom = async (
	roomId: string,
	user: Required<Pick<IUser, '_id' | 'username' | 'name'>>,
	priority?: Pick<ILivechatPriority, 'name' | 'i18n'>,
) => {
	await Message.saveSystemMessage('omnichannel_priority_change_history', roomId, '', user, {
		priorityData: {
			definedBy: {
				_id: user._id,
				username: user.username,
			},
			...(priority && { priority }),
		},
	});
};
