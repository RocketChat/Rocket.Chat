import type { ReportResult, ReportWithUnmatchingElements, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import mem from 'mem';
import type { Filter } from 'mongodb';

type AggParams = { start: Date; end: Date; sort: Record<string, 1 | -1>; extraQuery: Filter<IOmnichannelRoom> };

const defaultValue = { data: [], total: 0 };
export const findAllConversationsBySource = async ({ start, end, extraQuery }: Omit<AggParams, 'sort'>): Promise<ReportResult> => {
	return (await LivechatRooms.getConversationsBySource(start, end, extraQuery).toArray())[0] || defaultValue;
};

export const findAllConversationsByStatus = async ({ start, end, extraQuery }: Omit<AggParams, 'sort'>): Promise<ReportResult> => {
	return (await LivechatRooms.getConversationsByStatus(start, end, extraQuery).toArray())[0] || defaultValue;
};

export const findAllConversationsByDepartment = async ({
	start,
	end,
	sort,
	extraQuery,
}: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByDepartment(start, end, sort, extraQuery).toArray(),
		LivechatRooms.getTotalConversationsWithoutDepartmentBetweenDates(start, end, extraQuery),
	]);

	return {
		...(result?.[0] || defaultValue),
		unspecified: total || 0,
	};
};

export const findAllConversationsByTags = async ({ start, end, sort, extraQuery }: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByTags(start, end, sort, extraQuery).toArray(),
		LivechatRooms.getConversationsWithoutTagsBetweenDate(start, end, extraQuery),
	]);

	return {
		...(result?.[0] || defaultValue),
		unspecified: total || 0,
	};
};

export const findAllConversationsByAgents = async ({ start, end, sort, extraQuery }: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByAgents(start, end, sort, extraQuery).toArray(),
		LivechatRooms.getTotalConversationsWithoutAgentsBetweenDate(start, end, extraQuery),
	]);

	return {
		...(result?.[0] || defaultValue),
		unspecified: total || 0,
	};
};

export const findAllConversationsBySourceCached = mem(findAllConversationsBySource, { maxAge: 60000, cacheKey: JSON.stringify });
export const findAllConversationsByStatusCached = mem(findAllConversationsByStatus, { maxAge: 60000, cacheKey: JSON.stringify });
export const findAllConversationsByDepartmentCached = mem(findAllConversationsByDepartment, { maxAge: 60000, cacheKey: JSON.stringify });
export const findAllConversationsByTagsCached = mem(findAllConversationsByTags, { maxAge: 60000, cacheKey: JSON.stringify });
export const findAllConversationsByAgentsCached = mem(findAllConversationsByAgents, { maxAge: 60000, cacheKey: JSON.stringify });
