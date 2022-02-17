import { SortOptionObject } from 'mongodb';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatVisitors, Messages, LivechatRooms } from '../../../../models/server/raw';
import { canAccessRoomAsync } from '../../../../authorization/server/functions/canAccessRoom';
import { ILivechatVisitor } from '../../../../../definition/ILivechatVisitor';

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

export async function findVisitedPages(
	userId: string,
	roomId: string,
	{
		offset,
		count,
		sort,
	}: {
		offset: string;
		count: number;
		sort: Record<string, unknown>;
	},
): Promise<{ pages: any[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
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
		offset: offset,
		total,
	};
}

export async function findChatHistory({
	userId,
	roomId,
	visitorId,
	pagination,
}: {
	userId: string;
	roomId: string;
	visitorId: string;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{ history: string[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Error('error-not-allowed');
	}

	const cursor = LivechatRooms.findByVisitorId(visitorId, {
		sort: pagination.sort || { ts: -1 },
		skip: pagination.offset,
		limit: pagination.count,
	});

	const total = await cursor.count();

	const history = await cursor.toArray();

	return {
		history,
		count: history.length,
		offset: pagination.offset,
		total,
	};
}

export async function searchChats({
	userId,
	roomId,
	visitorId,
	searchText,
	closedChatsOnly,
	served,
	pagination,
}: {
	userId: string;
	roomId: string;
	visitorId: string;
	searchText: string;
	closedChatsOnly: boolean;
	served: boolean;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{ history: string[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}

	if (!(await canAccessRoomAsync(room, { _id: userId }))) {
		throw new Error('error-not-allowed');
	}

	const options = {
		sort: pagination.sort || { ts: -1 },
		skip: pagination.offset,
		limit: pagination.count,
	};

	const [total] = await LivechatRooms.findRoomsByVisitorIdAndMessageWithCriteria({
		visitorId,
		open: !closedChatsOnly,
		served,
		searchText,
		onlyCount: true,
	}).toArray();
	const cursor = await LivechatRooms.findRoomsByVisitorIdAndMessageWithCriteria({
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
		offset: pagination.offset,
		total: total?.count || 0,
	};
}

export async function findVisitorsToAutocomplete({
	userId,
	selector,
}: {
	userId: string;
	selector: { exceptions: any[]; conditions: any[]; term: string };
}): Promise<{ items: ILivechatVisitor[] }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		return { items: [] };
	}
	const { exceptions = [], conditions = {} } = selector;

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

	const items = await LivechatVisitors.findByNameRegexWithExceptionsAndConditions(selector.term, exceptions, conditions, options).toArray();
	return {
		items,
	};
}

export async function findVisitorsByEmailOrPhoneOrNameOrUsername({
	userId,
	term,
	pagination,
}: {
	userId: string;
	term: string;
	pagination: { offset: number; count: number; sort: [string, number][] | SortOptionObject<ILivechatVisitor> | undefined };
}): Promise<{ visitors: ILivechatVisitor[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const cursor = LivechatVisitors.findVisitorsByEmailOrPhoneOrNameOrUsername(term, {
		sort: pagination.sort || { ts: -1 },
		skip: pagination.offset,
		limit: pagination.count,
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
		offset: pagination.offset,
		total,
	};
}
