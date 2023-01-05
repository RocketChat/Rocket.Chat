import type { IMessage, IRoom, ReadReceipt } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

type ChatSendMessage = {
	message: Partial<IMessage>;
};

const chatSendMessageSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'object',
		},
	},
	required: ['message'],
	additionalProperties: false,
};

export const isChatSendMessageProps = ajv.compile<ChatFollowMessage>(chatSendMessageSchema);

type ChatFollowMessage = {
	mid: IMessage['_id'];
};

const chatFollowMessageSchema = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	required: ['mid'],
	additionalProperties: false,
};

export const isChatFollowMessageProps = ajv.compile<ChatFollowMessage>(chatFollowMessageSchema);

type ChatUnfollowMessage = {
	mid: IMessage['_id'];
};

const chatUnfollowMessageSchema = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
		},
	},
	required: ['mid'],
	additionalProperties: false,
};

export const isChatUnfollowMessageProps = ajv.compile<ChatUnfollowMessage>(chatUnfollowMessageSchema);

type ChatGetMessage = {
	msgId: IMessage['_id'];
};

const ChatGetMessageSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatGetMessageProps = ajv.compile<ChatGetMessage>(ChatGetMessageSchema);

type ChatStarMessage = {
	msgId: IMessage['_id'];
};

const ChatStarMessageSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatStarMessageProps = ajv.compile<ChatStarMessage>(ChatStarMessageSchema);

type ChatUnstarMessage = {
	msgId: IMessage['_id'];
};

const ChatUnstarMessageSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatUnstarMessageProps = ajv.compile<ChatUnstarMessage>(ChatUnstarMessageSchema);

type ChatPinMessage = {
	msgId: IMessage['_id'];
};

const ChatPinMessageSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatPinMessageProps = ajv.compile<ChatPinMessage>(ChatPinMessageSchema);

type ChatUnpinMessage = {
	messageId: IMessage['_id'];
};

const ChatUnpinMessageSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatUnpinMessageProps = ajv.compile<ChatUnpinMessage>(ChatUnpinMessageSchema);

type ChatGetDiscussions = {
	roomId: IRoom['_id'];
	text?: string;
	offset: number;
	count: number;
};

const ChatGetDiscussionsSchema = {
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

export const isChatGetDiscussionsProps = ajv.compile<ChatGetDiscussions>(ChatGetDiscussionsSchema);

type ChatReportMessage = {
	messageId: IMessage['_id'];
	description: string;
};

const ChatReportMessageSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
	},
	required: ['messageId', 'description'],
	additionalProperties: false,
};

export const isChatReportMessageProps = ajv.compile<ChatReportMessage>(ChatReportMessageSchema);

type ChatGetThreadsList = {
	rid: IRoom['_id'];
	type: 'unread' | 'following' | 'all';
	text?: string;
	offset: number;
	count: number;
};

const ChatGetThreadsListSchema = {
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
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['rid', 'type'],
	additionalProperties: false,
};

export const isChatGetThreadsListProps = ajv.compile<ChatGetThreadsList>(ChatGetThreadsListSchema);

type ChatSyncThreadsList = {
	rid: IRoom['_id'];
	updatedSince: string;
};

const ChatSyncThreadsListSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		updatedSince: {
			type: 'string',
		},
	},
	required: ['rid', 'updatedSince'],
	additionalProperties: false,
};

export const isChatSyncThreadsListProps = ajv.compile<ChatSyncThreadsList>(ChatSyncThreadsListSchema);

type ChatDelete = {
	msgId: IMessage['_id'];
	roomId: IRoom['_id'];
};

const ChatDeleteSchema = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
		roomId: {
			type: 'string',
		},
	},
	required: ['msgId', 'roomId'],
	additionalProperties: false,
};

export const isChatDeleteProps = ajv.compile<ChatDelete>(ChatDeleteSchema);

type ChatReact = { emoji: string; messageId: IMessage['_id'] } | { reaction: string; messageId: IMessage['_id'] };

const ChatReactSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				emoji: {
					type: 'string',
				},
				messageId: {
					type: 'string',
				},
			},
			required: ['emoji', 'messageId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				reaction: {
					type: 'string',
				},
				messageId: {
					type: 'string',
				},
			},
			required: ['reaction', 'messageId'],
			additionalProperties: false,
		},
	],
};

export const isChatReactProps = ajv.compile<ChatReact>(ChatReactSchema);

/**
 * The param `ignore` cannot be boolean, since this is a GET method. Use strings 'true' or 'false' instead.
 * @param {string} ignore
 */
type ChatIgnoreUser = {
	rid: string;
	userId: string;
	ignore: string;
};

const ChatIgnoreUserSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
		ignore: {
			type: 'string',
		},
	},
	required: ['rid', 'userId', 'ignore'],
	additionalProperties: false,
};

export const isChatIgnoreUserProps = ajv.compile<ChatIgnoreUser>(ChatIgnoreUserSchema);

type ChatSearch = {
	roomId: IRoom['_id'];
	searchText: string;
	count: number;
	offset: number;
};

const ChatSearchSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		searchText: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
		offset: {
			type: 'number',
		},
	},
	required: ['roomId', 'searchText', 'count', 'offset'],
	additionalProperties: false,
};

export const isChatSearchProps = ajv.compile<ChatSearch>(ChatSearchSchema);

type ChatUpdate = {
	roomId: IRoom['_id'];
	msgId: string;
	text: string;
};

const ChatUpdateSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		msgId: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
	},
	required: ['roomId', 'msgId', 'text'],
	additionalProperties: false,
};

export const isChatUpdateProps = ajv.compile<ChatUpdate>(ChatUpdateSchema);

type ChatGetMessageReadReceipts = {
	messageId: IMessage['_id'];
};

const ChatGetMessageReadReceiptsSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatGetMessageReadReceiptsProps = ajv.compile<ChatGetMessageReadReceipts>(ChatGetMessageReadReceiptsSchema);

export type ChatEndpoints = {
	'/v1/chat.sendMessage': {
		POST: (params: ChatSendMessage) => IMessage;
	};
	'/v1/chat.getMessage': {
		GET: (params: ChatGetMessage) => {
			message: IMessage;
		};
	};
	'/v1/chat.followMessage': {
		POST: (params: ChatFollowMessage) => void;
	};
	'/v1/chat.unfollowMessage': {
		POST: (params: ChatUnfollowMessage) => void;
	};
	'/v1/chat.starMessage': {
		POST: (params: ChatStarMessage) => void;
	};
	'/v1/chat.unStarMessage': {
		POST: (params: ChatUnstarMessage) => void;
	};
	'/v1/chat.pinMessage': {
		POST: (params: ChatPinMessage) => void;
	};
	'/v1/chat.unPinMessage': {
		POST: (params: ChatUnpinMessage) => void;
	};
	'/v1/chat.reportMessage': {
		POST: (params: ChatReportMessage) => void;
	};
	'/v1/chat.getDiscussions': {
		GET: (params: ChatGetDiscussions) => {
			messages: IMessage[];
			total: number;
		};
	};
	'/v1/chat.getThreadsList': {
		GET: (params: ChatGetThreadsList) => {
			threads: IMessage[];
			total: number;
		};
	};
	'/v1/chat.syncThreadsList': {
		GET: (params: ChatSyncThreadsList) => {
			threads: {
				update: IMessage[];
				remove: IMessage[];
			};
		};
	};
	'/v1/chat.delete': {
		POST: (params: ChatDelete) => {
			_id: string;
			ts: string;
			message: Pick<IMessage, '_id' | 'rid' | 'u'>;
		};
	};
	'/v1/chat.react': {
		POST: (params: ChatReact) => void;
	};
	'/v1/chat.ignoreUser': {
		GET: (params: ChatIgnoreUser) => void;
	};
	'/v1/chat.search': {
		GET: (params: ChatSearch) => {
			messages: IMessage[];
		};
	};
	'/v1/chat.update': {
		POST: (params: ChatUpdate) => {
			messages: IMessage;
		};
	};
	'/v1/chat.getMessageReadReceipts': {
		GET: (params: ChatGetMessageReadReceipts) => { receipts: ReadReceipt[] };
	};
};
