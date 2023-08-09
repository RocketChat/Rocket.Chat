import type { ReportResult } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

export const findAllConversationsBySource = async ({ start, end }: { start: Date; end: Date }): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsBySource(start, end).toArray())[0];
};

export const findAllConversationsByStatus = async ({ start, end }: { start: Date; end: Date }): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByStatus(start, end).toArray())[0];
};

export const findAllConversationsByDepartment = async ({ start, end }: { start: Date; end: Date }): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByDepartment(start, end).toArray())[0];
};

export const findAllConversationsByTags = async ({ start, end }: { start: Date; end: Date }): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByTags(start, end).toArray())[0];
};

export const findAllConversationsByAgents = async ({ start, end }: { start: Date; end: Date }): Promise<ReportResult | undefined> => {
	return (await LivechatRooms.getConversationsByAgents(start, end).toArray())[0];
};
