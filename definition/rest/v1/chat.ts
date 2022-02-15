import Ajv, { JSONSchemaType } from 'ajv';

import type { IMessage } from '../../IMessage';
import type { IRoom } from '../../IRoom';

const ajv = new Ajv();

// First POST param
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

// Second POST param
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

// ENDPOINTS
export type ChatEndpoints = {
	'chat.getMessage': {
		GET: (params: { msgId: IMessage['_id'] }) => {
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
		GET: (params: { roomId: IRoom['_id']; text?: string; offset: number; count: number }) => {
			messages: IMessage[];
			total: number;
		};
	};
	'chat.getThreadsList': {
		GET: (params: { rid: IRoom['_id']; type: 'unread' | 'following' | 'all'; text?: string; offset: number; count: number }) => {
			threads: IMessage[];
			total: number;
		};
	};
};
