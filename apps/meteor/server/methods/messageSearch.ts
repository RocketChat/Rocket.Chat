import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Logger } from '@rocket.chat/logger';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../app/authorization/server/functions/canAccessRoom';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';
import type { IRawSearchResult } from '../../app/search/server/model/ISearchResult';
import { settings } from '../../app/settings/server';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';
import { parseMessageSearchQuery } from '../lib/parseMessageSearchQuery';

const logger = new Logger('MessageSearch');

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		messageSearch(text: string, rid?: string, limit?: number, offset?: number): IRawSearchResult | false;
	}
}

export type MessageSearchFilters = {
	fromUsername?: string;
	fromUsernames?: string[];
	rids?: string[];
	roomNames?: string[];
	startDate?: Date;
	endDate?: Date;
};

const getUsernameLookupValues = (username: string): string[] => {
	const trimmed = username.trim();
	if (!trimmed) {
		return [];
	}

	const withoutMentionPrefix = trimmed.replace(/^@(?=[^@])/, '');
	return [...new Set([trimmed, withoutMentionPrefix])];
};

const getUserIdsByUsernames = async (usernames: string[]): Promise<string[] | undefined> => {
	const requestedUsernames = usernames.map((username) => getUsernameLookupValues(username)).filter((values) => values.length);
	if (!requestedUsernames.length) {
		return undefined;
	}

	const usernameLookupValues = [...new Set(requestedUsernames.flat())];
	const users = await Users.find(
		{ username: { $in: usernameLookupValues } },
		{
			projection: { _id: 1, username: 1 },
		},
	).toArray();

	return users.map(({ _id }) => _id);
};

const getRoomIdsByNames = async (roomNames: string[]): Promise<string[] | undefined> => {
	const normalizedRoomNames = [...new Set(roomNames.filter(Boolean))];
	if (!normalizedRoomNames.length) {
		return undefined;
	}

	const rooms = await Promise.all(normalizedRoomNames.map((roomName) => Rooms.findOneByNameOrFname(roomName, { projection: { _id: 1 } })));

	return rooms.reduce<string[]>((roomIds, room) => {
		if (typeof room?._id === 'string') {
			roomIds.push(room._id);
		}

		return roomIds;
	}, []);
};

const mergeDateFilter = (current: unknown, startDate?: Date, endDate?: Date): Record<string, Date> => {
	const previous = current && typeof current === 'object' && !Array.isArray(current) ? (current as Record<string, Date>) : {};

	return {
		...previous,
		...(startDate && { $gte: startDate }),
		...(endDate && { $lte: endDate }),
	};
};

const getRoomSearchScope = async (userId: string | undefined, filters?: MessageSearchFilters): Promise<string[]> => {
	const roomNameIds = await getRoomIdsByNames(filters?.roomNames || []);
	const hasRoomFilter = Boolean(filters?.rids?.length || roomNameIds);
	const filterRoomIds = [...new Set([...(filters?.rids || []), ...(roomNameIds || [])].filter(Boolean))];
	const subscribedRoomIds = userId
		? await Subscriptions.findByUserId(userId, { projection: { rid: 1 } })
				.map(({ rid }) => rid)
				.toArray()
		: [];

	return hasRoomFilter ? subscribedRoomIds.filter((roomId) => filterRoomIds.includes(roomId)) : subscribedRoomIds;
};

export const messageSearch = async function (
	userId: string,
	text: string,
	rid?: string,
	limit?: number,
	offset?: number,
	filters?: MessageSearchFilters,
): Promise<IRawSearchResult | false> {
	check(text, String);
	check(rid, Match.Maybe(String));
	check(limit, Match.Optional(Number));
	check(offset, Match.Optional(Number));

	// Don't process anything else if the user can't access the room
	if (rid) {
		if (!(await canAccessRoomIdAsync(rid, userId))) {
			return false;
		}
	} else if (settings.get('Search.defaultProvider.GlobalSearchEnabled') !== true) {
		return {
			message: {
				docs: [],
			},
		};
	}

	const user = (await Users.findOneById(userId)) || undefined;

	let parsedQuery: ReturnType<typeof parseMessageSearchQuery>;

	try {
		parsedQuery = parseMessageSearchQuery(text, {
			user,
			offset,
			limit,
			forceRegex: settings.get('Message_AlwaysSearchRegExp'),
		});
	} catch (error: unknown) {
		logger.error({ msg: 'Error while parsing message search query', error });
		if (error instanceof SyntaxError) {
			return { message: { docs: [] } };
		}
		throw error;
	}

	const { query, options } = parsedQuery;

	if (Object.keys(query).length === 0) {
		return {
			message: {
				docs: [],
			},
		};
	}

	query.t = {
		$ne: 'rm', // hide removed messages (useful when searching for user messages)
	};
	query._hidden = {
		$ne: true, // don't return _hidden messages
	};

	if (rid) {
		query.rid = rid;
	} else {
		query.rid = {
			$in: await getRoomSearchScope(user?._id, filters),
		};
	}

	const filterUserIds = await getUserIdsByUsernames([
		...(filters?.fromUsernames || []),
		...(filters?.fromUsername ? [filters.fromUsername] : []),
	]);
	if (filterUserIds?.length === 0) {
		return {
			message: {
				docs: [],
			},
		};
	}

	if (filterUserIds?.length) {
		query['u._id'] = filterUserIds.length === 1 ? filterUserIds[0] : { $in: filterUserIds };
	}

	if (filters?.startDate || filters?.endDate) {
		query.ts = mergeDateFilter(query.ts, filters.startDate, filters.endDate);
	}

	try {
		return {
			message: {
				docs: await Messages.find(query, {
					// @ts-expect-error col.s.db is not typed
					readPreference: readSecondaryPreferred(Messages.col.s.db),
					...options,
				}).toArray(),
			},
		};
	} catch (error) {
		logger.error({ msg: 'Error while finding messages', error });
		throw new Error('error-while-finding-messages', { cause: error });
	}
};

Meteor.methods<ServerMethods>({
	async messageSearch(text, rid, limit, offset) {
		methodDeprecationLogger.method('messageSearch', '9.0.0', '/v1/chat.search');
		const currentUserId = Meteor.userId();
		if (!currentUserId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'messageSearch',
			});
		}

		return messageSearch(currentUserId, text, rid, limit, offset);
	},
});
