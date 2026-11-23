import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';

type ScheduledMessageFiles = { _id: string; name: string; description?: string }[];
type Encrypted = { content?: IMessage['content']; e2eMentions?: IMessage['e2eMentions'] };

export type ScheduledMessagesCreateProps = {
	rid: string;
	msg: string;
	scheduledAt: string;
	tmid?: string;
	tshow?: boolean;
	files?: ScheduledMessageFiles;
	t?: 'e2e';
} & Encrypted;

export type ScheduledMessagesListProps = { offset?: number; count?: number };

export type ScheduledMessagesUpdateProps = {
	scheduledMessageId: string;
	msg?: string;
	scheduledAt?: string;
	files?: ScheduledMessageFiles;
} & Encrypted;

export type ScheduledMessagesIdProps = { scheduledMessageId: string };

export type ScheduledMessagesEndpoints = {
	'/experimental/scheduledMessages.create': {
		POST: (params: ScheduledMessagesCreateProps) => {
			scheduledMessage: IScheduledMessage;
		};
	};
	'/experimental/scheduledMessages.list': {
		GET: (params: ScheduledMessagesListProps) => {
			scheduledMessages: IScheduledMessage[];
			total: number;
			offset: number;
			count: number;
		};
	};
	'/experimental/scheduledMessages.update': {
		POST: (params: ScheduledMessagesUpdateProps) => {
			scheduledMessage: IScheduledMessage;
		};
	};
	'/experimental/scheduledMessages.sendNow': {
		POST: (params: ScheduledMessagesIdProps) => { message: IMessage };
	};
	'/experimental/scheduledMessages.delete': {
		POST: (params: ScheduledMessagesIdProps) => void;
	};
};
