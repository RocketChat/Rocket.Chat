import type { IMessage, IScheduledMessage } from '@rocket.chat/core-typings';

type ScheduledMessageFiles = { _id: string; name: string; description?: string }[];
type Encrypted = { content?: IMessage['content']; e2eMentions?: IMessage['e2eMentions'] };

export type ScheduledMessagesEndpoints = {
	'/experimental/scheduledMessages.create': {
		POST: (
			params: {
				rid: string;
				msg: string;
				scheduledAt: string;
				tmid?: string;
				tshow?: boolean;
				files?: ScheduledMessageFiles;
				t?: 'e2e';
			} & Encrypted,
		) => {
			scheduledMessage: IScheduledMessage;
		};
	};
	'/experimental/scheduledMessages.list': {
		GET: (params: { offset?: number; count?: number }) => {
			scheduledMessages: IScheduledMessage[];
			total: number;
			offset: number;
			count: number;
		};
	};
	'/experimental/scheduledMessages.update': {
		POST: (params: { scheduledMessageId: string; msg?: string; scheduledAt?: string; files?: ScheduledMessageFiles } & Encrypted) => {
			scheduledMessage: IScheduledMessage;
		};
	};
	'/experimental/scheduledMessages.sendNow': {
		POST: (params: { scheduledMessageId: string }) => { message: IMessage };
	};
	'/experimental/scheduledMessages.delete': {
		POST: (params: { scheduledMessageId: string }) => void;
	};
};
