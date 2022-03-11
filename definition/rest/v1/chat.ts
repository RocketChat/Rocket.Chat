import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';

const ajv = new Ajv();

type ChatFollowMessage = {
	mid: IMessage['_id'];
};

const chatFollowMessageSchema: JSONSchemaType<ChatFollowMessage> = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	required: ['mid'],
	additionalProperties: false,
};

export const isChatFollowMessage = ajv.compile(chatFollowMessageSchema);

type ChatUnfollowMessage = {
	mid: IMessage['_id'];
};

const chatUnfollowMessageSchema: JSONSchemaType<ChatUnfollowMessage> = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	required: ['mid'],
	additionalProperties: false,
};

export const isChatUnfollowMessage = ajv.compile(chatUnfollowMessageSchema);

type ChatGetMessage = {
	msgId: IMessage['_id'];
};

const ChatGetMessageSchema: JSONSchemaType<ChatGetMessage> = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatGetMessage = ajv.compile(ChatGetMessageSchema);

type ChatGetDiscussions = {
	roomId: IRoom['_id'];
	text?: string;
	offset: number;
	count: number;
};

const ChatGetDiscussionsSchema: JSONSchemaType<ChatGetDiscussions> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		text: {
			type: 'string',
			nullable: true,
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
	},
	required: ['roomId', 'offset', 'count'],
	additionalProperties: false,
};

export const isChatGetDiscussions = ajv.compile(ChatGetDiscussionsSchema);

type ChatGetThreadsList = {
	rid: IRoom['_id'];
	type: 'unread' | 'following' | 'all';
	text?: string;
	offset: number;
	count: number;
};

const ChatGetThreadsListSchema: JSONSchemaType<ChatGetThreadsList> = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		type: {
			type: 'string',
		},
		text: {
			type: 'string',
			nullable: true,
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
	},
	required: ['rid', 'type', 'offset', 'count'],
	additionalProperties: false,
};

export const isChatGetThreadsList = ajv.compile(ChatGetThreadsListSchema);

export type ChatEndpoints = {
	'chat.getMessage': {
		GET: (params: ChatGetMessage) => {
			message: IMessage;
		};
	};
	'chat.followMessage': {
		POST: (params: ChatFollowMessage) => void;
	};
	'chat.unfollowMessage': {
		POST: (params: ChatUnfollowMessage) => void;
	};
	'chat.getDiscussions': {
		GET: (params: ChatGetDiscussions) => {
			messages: IMessage[];
			total: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: ChatGetThreadsList) => {
			threads: IMessage[];
			total: number;
		};
	};
};
