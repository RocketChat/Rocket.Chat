import type { ILivechatVisitor, IMessage, IOmnichannelRoom, IRoom, IUser, IVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors, Messages, LivechatRooms, LivechatCustomField } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { canAccessRoomAsync } from '../../../../authorization/server/functions/canAccessRoom';

export async function findVisitorInfo({ visitorId }: { visitorId: IVisitor['_id'] }) {
	const visitor = await LivechatVisitors.findOneById(visitorId);
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
}: {
	roomId: IRoom['_id'];
	pagination: { offset: number; count: number; sort: FindOptions<IMessage>['sort'] };
}) {
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

export async function findChatHistory({
	userId,
	roomId,
	visitorId,
	pagination: { offset, count, sort },
}: {
	userId: IUser['_id'];
	roomId: IRoom['_id'];
	visitorId: IVisitor['_id'];
	pagination: { offset: number; count: number; sort: FindOptions<IOmnichannelRoom>['sort'] };
}) {
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
	source,
	pagination: { offset, count, sort },
}: {
	userId: IUser['_id'];
	roomId: IRoom['_id'];
	visitorId: IVisitor['_id'];
	searchText?: string;
	closedChatsOnly?: string;
	servedChatsOnly?: string;
	source?: string;
	pagination: { offset: number; count: number; sort: FindOptions<IOmnichannelRoom>['sort'] };
}) {
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
		open: closedChatsOnly !== 'true',
		served: served === 'true',
		searchText,
		onlyCount: true,
		source,
	}).toArray();
	const cursor = await LivechatRooms.findRoomsByVisitorIdAndMessageWithCriteria({
		visitorId,
		open: closedChatsOnly !== 'true',
		served: served === 'true',
		searchText,
		options,
		source,
	});

	const history = await cursor.toArray();

	return {
		history,
		count: history.length,
		offset,
		total: total?.count ?? 0,
	};
}

export async function findVisitorsToAutocomplete({
	selector,
}: {
	selector: {
		exceptions?: ILivechatVisitor['_id'][];
		conditions?: Record<string, unknown>;
		term: string;
	};
}) {
	const { exceptions = [], conditions = {} } = selector;

	const options: FindOptions<ILivechatVisitor> = {
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

export async function findVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField({
	emailOrPhone,
	nameOrUsername,
	pagination: { offset, count, sort },
}: {
	emailOrPhone?: string;
	nameOrUsername?: RegExp;
	pagination: { offset: number; count: number; sort: FindOptions<IVisitor>['sort'] };
}) {
	const allowedCF = await LivechatCustomField.findMatchingCustomFields('visitor', true, { projection: { _id: 1 } })
		.map((cf) => cf._id)
		.toArray();

	const { cursor, totalCount } = await LivechatVisitors.findPaginatedVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField(
		emailOrPhone,
		nameOrUsername,
		allowedCF,
		{
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
		},
	);

	const [visitors, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		visitors,
		count: visitors.length,
		offset,
		total,
	};
}
