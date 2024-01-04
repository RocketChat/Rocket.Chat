import type { IOmnichannelServiceLevelAgreements, IUser } from '@rocket.chat/core-typings';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { FindOptions } from 'mongodb';

import {
	addSlaChangeHistoryToRoom,
	removeInquiryQueueSla,
	removeSlaFromRoom,
	updateInquiryQueueSla,
	updateRoomSlaWeights,
} from '../../lib/SlaHelper';

type FindSLAParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<IOmnichannelServiceLevelAgreements>['sort'];
	};
};

export async function findSLA({
	text,
	pagination: { offset, count, sort },
}: FindSLAParams): Promise<PaginatedResult<{ sla: IOmnichannelServiceLevelAgreements[] }>> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await OmnichannelServiceLevelAgreements.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [sla, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		sla,
		count: sla.length,
		offset,
		total,
	};
}

export const updateRoomSLA = async (
	roomId: string,
	user: Required<Pick<IUser, '_id' | 'username' | 'name'>>,
	sla: Pick<IOmnichannelServiceLevelAgreements, '_id' | 'name' | 'dueTimeInMinutes'>,
) => {
	await Promise.all([updateInquiryQueueSla(roomId, sla), updateRoomSlaWeights(roomId, sla), addSlaChangeHistoryToRoom(roomId, user, sla)]);
};

export const removeRoomSLA = async (roomId: string, user: Required<Pick<IUser, '_id' | 'username' | 'name'>>) => {
	await Promise.all([removeInquiryQueueSla(roomId), removeSlaFromRoom(roomId), addSlaChangeHistoryToRoom(roomId, user)]);
};
