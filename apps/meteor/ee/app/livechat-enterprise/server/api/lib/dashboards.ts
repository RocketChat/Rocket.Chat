import type { ReportResult, ReportWithUnmatchingElements } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import mem from 'mem';

type AggParams = { start: Date; end: Date; sort: Record<string, 1 | -1> };

const defaultValue = { data: [], total: 0 };
export const findAllConversationsBySource = async ({ start, end }: Omit<AggParams, 'sort'>): Promise<ReportResult> => {
	return (await LivechatRooms.getConversationsBySource(start, end).toArray())[0] || defaultValue;
};

export const findAllConversationsByStatus = async ({ start, end }: Omit<AggParams, 'sort'>): Promise<ReportResult> => {
	return (await LivechatRooms.getConversationsByStatus(start, end).toArray())[0] || defaultValue;
};

export const findAllConversationsByDepartment = async ({ start, end, sort }: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByDepartment(start, end, sort).toArray(),
		LivechatRooms.getTotalConversationsWithoutDepartmentBetweenDates(start, end),
	]);

	return {
		...(result?.[0] || defaultValue),
		unspecified: total || 0,
	};
};

export const findAllConversationsByTags = async ({ start, end, sort }: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByTags(start, end, sort).toArray(),
		LivechatRooms.getConversationsWithoutTagsBetweenDate(start, end),
	]);

	return {
		...(result?.[0] || defaultValue),
		unspecified: total || 0,
	};
};

export const findAllConversationsByAgents = async ({ start, end, sort }: AggParams): Promise<ReportWithUnmatchingElements> => {
	const [result, total] = await Promise.all([
		LivechatRooms.getConversationsByAgents(start, end, sort).toArray(),
		LivechatRooms.getTotalConversationsWithoutAgentsBetweenDate(start, end),
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
