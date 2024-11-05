import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatContacts, LivechatRooms } from '@rocket.chat/models';
import type { PaginatedResult, VisitorSearchChatsResult } from '@rocket.chat/rest-typings';
import type { FindOptions, Sort } from 'mongodb';

export type GetContactHistoryParams = {
	contactId: string;
	source?: string;
	count: number;
	offset: number;
	sort: Sort;
};

export async function getContactHistory(
	params: GetContactHistoryParams,
): Promise<PaginatedResult<{ history: VisitorSearchChatsResult[] }>> {
	const { contactId, source, count, offset, sort } = params;

	const contact = await LivechatContacts.findOneById<Pick<ILivechatContact, '_id'>>(contactId, { projection: { _id: 1 } });

	if (!contact) {
		throw new Error('error-contact-not-found');
	}

	const options: FindOptions<IOmnichannelRoom> = {
		sort: sort || { closedAt: -1 },
		skip: offset,
		limit: count,
		projection: {
			fname: 1,
			ts: 1,
			v: 1,
			msgs: 1,
			servedBy: 1,
			closedAt: 1,
			closedBy: 1,
			closer: 1,
			tags: 1,
			source: 1,
			lastMessage: 1,
			verified: 1,
		},
	};

	const { totalCount, cursor } = LivechatRooms.findClosedRoomsByContactAndSourcePaginated({
		contactId: contact._id,
		source,
		options,
	});

	const [total, history] = await Promise.all([totalCount, cursor.toArray()]);

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}
