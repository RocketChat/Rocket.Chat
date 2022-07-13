import { LivechatVisitors, Messages, LivechatRooms } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { canAccessRoomAsync } from '../../../../authorization/server/functions/canAccessRoom';

export async function findVisitorInfo({ userId, visitorId }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const visitor = await LivechatVisitors.findOneById(visitorId);
	if (!visitor) {
		throw new Error('visitor-not-found');
	}

	return {
		visitor,
	};
}

export async function findVisitedPages({ userId, roomId, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('invalid-room');
	}
	const { cursor, totalCount } = Messages.findPaginatedByRoomIdAndType(room._id, 'livechat_navigation_history', {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const [pages, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		pages,
		count: pages.length,
		offset,
		total,
	};
}

export async function findChatHistory({ userId, roomId, visitorId, pagination: { offset, count, sort } }) {
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

	const { cursor, totalCount } = LivechatRooms.findPaginatedByVisitorId(visitorId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const [history, total] = await Promise.all([cursor.toArray(), totalCount]);

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
}) {
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
		offset,
		total: (total && total.count) || 0,
	};
}

export async function findVisitorsToAutocomplete({ userId, selector }) {
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
	emailOrPhone,
	nameOrUsername,
	pagination: { offset, count, sort },
}) {
	if (!(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const { cursor, totalCount } = LivechatVisitors.findPaginatedVisitorsByEmailOrPhoneOrNameOrUsername(emailOrPhone, nameOrUsername, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
		projection: {
			username: 1,
			name: 1,
			phone: 1,
			livechatData: 1,
			visitorEmails: 1,
			lastChat: 1,
		},
	});

	const [visitors, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		visitors,
		count: visitors.length,
		offset,
		total,
	};
}
