import { escapeRegExp } from '@rocket.chat/string-helpers';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { IOmnichannelServiceLevelAgreements, IUser } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

import {
	addSlaChangeHistoryToRoom,
	removeInquiryQueueSla,
	removeSlaFromRoom,
	updateInquiryQueueSla,
	updateRoomSlaWeights,
} from '../../lib/SlaNPriorityHelper';

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

export const updateRoomSLA = async (roomId: string, user: IUser, sla: IOmnichannelServiceLevelAgreements) => {
	await Promise.all([updateInquiryQueueSla(roomId, sla), updateRoomSlaWeights(roomId, sla), addSlaChangeHistoryToRoom(roomId, user, sla)]);
};

export const removeRoomSLA = async (roomId: string, user: IUser) => {
	await Promise.all([removeInquiryQueueSla(roomId), removeSlaFromRoom(roomId), addSlaChangeHistoryToRoom(roomId, user)]);
};
