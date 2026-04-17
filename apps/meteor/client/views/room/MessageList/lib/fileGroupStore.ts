import type { IMessage } from '@rocket.chat/core-typings';

const fileGroups = new Map<string, IMessage[]>();

export const registerFileGroup = (leaderId: string, groupedMessages: IMessage[]) => {
	fileGroups.set(leaderId, groupedMessages);
};

export const unregisterFileGroup = (leaderId: string) => {
	fileGroups.delete(leaderId);
};

export const getFileGroupMessages = (leaderId: string): IMessage[] | undefined => fileGroups.get(leaderId);
