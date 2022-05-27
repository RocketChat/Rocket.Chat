import { ILivechatVisitor, IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { FilterQuery, SortOptionObject } from 'mongodb';
import { PaginatedResult } from '@rocket.chat/rest-typings';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatVisitors, Messages, LivechatRooms } from '../../../../models/server/raw';
import { canAccessRoomAsync } from '../../../../authorization/server/functions/canAccessRoom';

type Pagination<T> = { pagination: { offset: number; count: number; sort: SortOptionObject<T> } };

type FindVisitedPagesParams = {
	roomId: string;
} & Pagination<IMessage>;
type FindVisitedPagesResult = PaginatedResult<{ pages: IMessage[] }>;

type FindChatHistoryParams = {
	userId: string; // user performing the request
	roomId: string;
	visitorId: string;
} & Pagination<IOmnichannelRoom>;
type FindChatHistoryResult = PaginatedResult<{ history: IOmnichannelRoom[] }>;

type SearchChatsParams = {
	userId: string; // user performing the request
	roomId: string;
	visitorId: string;
	searchText?: string;
	closedChatsOnly: boolean;
	servedChatsOnly: boolean;
} & Pagination<IOmnichannelRoom>;
type SearchChatsResult = PaginatedResult<{ history: IOmnichannelRoom[] }>;

type FindVisitorsToAutocompleteParams = {
	selector: {
		term: string;
		exceptions: string[];
		conditions: FilterQuery<ILivechatVisitor>;
	};
};
type FindVisitorsToAutocompleteResult = { items: Array<ILivechatVisitor & { custom_name: string }> };

type FindVisitorsByEmailOrPhoneOrNameOrUsernameParams = {
	term: string;
} & Pagination<ILivechatVisitor>;
type FindVisitorsByEmailOrPhoneOrNameOrUsernameResult = PaginatedResult<{ visitors: ILivechatVisitor[] }>;

export async function findVisitorInfo({
	userId,
	visitorId,
}: {
	userId: string;
	visitorId: string;
}): Promise<{ visitor: ILivechatVisitor }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const visitor = await LivechatVisitors.findOneById(visitorId, {});
	if (!visitor) {
		throw new Error('visitor-not-found');
	}

	return {
		visitor,
	};
}

export async function findVisitedPages({
	roomId,
	pagination: { offset, count, sort },
}: FindVisitedPagesParams): Promise<FindVisitedPagesResult> {
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	const cursor = Messages.findByRoomIdAndType(room._id, 'livechat_navigation_history', {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const pages = await cursor.toArray();

	return {
		pages,
		count: pages.length,
		offset,
		total,
	};
}

export async function findChatHistory({
	userId,
	roomId,
	visitorId,
	pagination: { offset, count, sort },
}: FindChatHistoryParams): Promise<FindChatHistoryResult> {
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Error('error-not-allowed');
	}

	const cursor = LivechatRooms.findByVisitorId(visitorId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const history = await cursor.toArray();

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}

export async function searchChats({
	userId,
	roomId,
	visitorId,
	searchText,
	closedChatsOnly,
	servedChatsOnly: served,
	pagination: { offset, count, sort },
}: SearchChatsParams): Promise<SearchChatsResult> {
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}

	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Error('error-not-allowed');
	}

	const options = {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	};

	const [total] = await LivechatRooms.findRoomsByVisitorIdAndMessageWithCriteria({
		visitorId,
		open: !closedChatsOnly,
		served,
		searchText,
		onlyCount: true,
	}).toArray();
	const cursor = LivechatRooms.findRoomsByVisitorIdAndMessageWithCriteria({
		visitorId,
		open: !closedChatsOnly,
		served,
		searchText,
		options,
	});

	const history = await cursor.toArray();

	return {
		history,
		count: history.length,
		offset,
		total: total?.count || 0,
	};
}

export async function findVisitorsToAutocomplete({
	selector,
}: FindVisitorsToAutocompleteParams): Promise<FindVisitorsToAutocompleteResult> {
	const { exceptions = [], conditions = {}, term } = selector;

	const options = {
		projection: {
			_id: 1,
			name: 1,
			username: 1,
		},
		limit: 10,
		sort: {
			name: 1,
		},
	};

	const items = await LivechatVisitors.findByNameRegexWithExceptionsAndConditions(term, exceptions, conditions, options).toArray();
	return {
		items,
	};
}

export async function findVisitorsByEmailOrPhoneOrNameOrUsername({
	term,
	pagination: { offset, count, sort },
}: FindVisitorsByEmailOrPhoneOrNameOrUsernameParams): Promise<FindVisitorsByEmailOrPhoneOrNameOrUsernameResult> {
	const cursor = LivechatVisitors.findVisitorsByEmailOrPhoneOrNameOrUsername(term, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
		projection: {
			_id: 1,
			username: 1,
			name: 1,
			phone: 1,
			livechatData: 1,
			visitorEmails: 1,
			lastChat: 1,
		},
	});

	const total = await cursor.count();

	const visitors = await cursor.toArray();

	return {
		visitors,
		count: visitors.length,
		offset,
		total,
	};
}
