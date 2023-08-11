import type { ReportResult } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';
import mem from 'mem';

type AggParams = { start: Date; end: Date; sort: Record<string, 1 | -1> };
export const findAllConversationsBySource = async ({ start, end }: Omit<AggParams, 'sort'>): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsBySource(start, end).toArray())[0];
};

export const findAllConversationsByStatus = async ({ start, end }: Omit<AggParams, 'sort'>): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByStatus(start, end).toArray())[0];
};

export const findAllConversationsByDepartment = async ({ start, end, sort }: AggParams): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByDepartment(start, end, sort).toArray())[0];
};

export const findAllConversationsByTags = async ({ start, end, sort }: AggParams): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByTags(start, end, sort).toArray())[0];
};

export const findAllConversationsByAgents = async ({ start, end, sort }: AggParams): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByAgents(start, end, sort).toArray())[0];
};

export const findAllConversationsBySourceCached = mem(findAllConversationsBySource, { maxAge: 10000, cacheKey: JSON.stringify });
export const findAllConversationsByStatusCached = mem(findAllConversationsByStatus, { maxAge: 10000, cacheKey: JSON.stringify });
export const findAllConversationsByDepartmentCached = mem(findAllConversationsByDepartment, { maxAge: 10000, cacheKey: JSON.stringify });
export const findAllConversationsByTagsCached = mem(findAllConversationsByTags, { maxAge: 10000, cacheKey: JSON.stringify });
export const findAllConversationsByAgentsCached = mem(findAllConversationsByAgents, { maxAge: 10000, cacheKey: JSON.stringify });
