import type { IMessage } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type ChatScheduleMessageProps = {
	roomId: string;
	message: string;
	scheduledAt: string;
	tmid?: string;
	alias?: string;
	avatar?: string;
	emoji?: string;
	attachments?: any[];
	customFields?: Record<string, any>;
};

const ChatScheduleMessagePropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		message: { type: 'string', minLength: 1 },
		scheduledAt: { type: 'string', minLength: 1 },
		tmid: { type: 'string', nullable: true },
		alias: { type: 'string', nullable: true },
		avatar: { type: 'string', nullable: true },
		emoji: { type: 'string', nullable: true },
		attachments: { type: 'array', nullable: true },
		customFields: { type: 'object', nullable: true },
	},
	required: ['roomId', 'message', 'scheduledAt'],
	additionalProperties: false,
};

export const isChatScheduleMessageProps = ajv.compile<ChatScheduleMessageProps>(ChatScheduleMessagePropsSchema);

export type ChatGetScheduledMessagesProps = {
	roomId: string;
	count?: number;
	offset?: number;
};

const ChatGetScheduledMessagesPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		count: { type: 'number', nullable: true },
		offset: { type: 'number', nullable: true },
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChatGetScheduledMessagesProps = ajv.compile<ChatGetScheduledMessagesProps>(ChatGetScheduledMessagesPropsSchema);

export type ChatCancelScheduledMessageProps = {
	messageId: string;
};

const ChatCancelScheduledMessagePropsSchema = {
	type: 'object',
	properties: {
		messageId: { type: 'string', minLength: 1 },
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatCancelScheduledMessageProps = ajv.compile<ChatCancelScheduledMessageProps>(ChatCancelScheduledMessagePropsSchema);

export type ChatScheduledMessagesEndpoints = {
	'/v1/chat.scheduleMessage': {
		POST: (params: ChatScheduleMessageProps) => {
			message: IMessage;
		};
	};
	'/v1/chat.getScheduledMessages': {
		GET: (params: ChatGetScheduledMessagesProps) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.cancelScheduledMessage': {
		POST: (params: ChatCancelScheduledMessageProps) => {
			success: boolean;
		};
	};
};
