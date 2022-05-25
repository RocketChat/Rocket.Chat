import type { IMessage, IRoom, ReadReceipt } from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

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

export const isChatFollowMessageProps = ajv.compile(chatFollowMessageSchema);

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

export const isChatUnfollowMessageProps = ajv.compile(chatUnfollowMessageSchema);

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

export const isChatGetMessageProps = ajv.compile(ChatGetMessageSchema);

type ChatStarMessage = {
	msgId: IMessage['_id'];
};

const ChatStarMessageSchema: JSONSchemaType<ChatStarMessage> = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatStarMessageProps = ajv.compile(ChatStarMessageSchema);

type ChatUnstarMessage = {
	msgId: IMessage['_id'];
};

const ChatUnstarMessageSchema: JSONSchemaType<ChatUnstarMessage> = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatUnstarMessageProps = ajv.compile(ChatUnstarMessageSchema);

type ChatPinMessage = {
	msgId: IMessage['_id'];
};

const ChatPinMessageSchema: JSONSchemaType<ChatPinMessage> = {
	type: 'object',
	properties: {
		msgId: {
			type: 'string',
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatPinMessageProps = ajv.compile(ChatPinMessageSchema);

type ChatUnpinMessage = {
	messageId: IMessage['_id'];
};

const ChatUnpinMessageSchema: JSONSchemaType<ChatUnpinMessage> = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatUnpinMessageProps = ajv.compile(ChatUnpinMessageSchema);

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

export const isChatGetDiscussionsProps = ajv.compile(ChatGetDiscussionsSchema);

type ChatReportMessage = {
	messageId: IMessage['_id'];
	description: string;
};

const ChatReportMessageSchema: JSONSchemaType<ChatReportMessage> = {
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

export const isChatReportMessageProps = ajv.compile(ChatReportMessageSchema);

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

export const isChatGetThreadsListProps = ajv.compile(ChatGetThreadsListSchema);

type ChatSyncThreadsList = {
	rid: IRoom['_id'];
	updatedSince: string;
};

const ChatSyncThreadsListSchema: JSONSchemaType<ChatSyncThreadsList> = {
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

export const isChatSyncThreadsListProps = ajv.compile(ChatSyncThreadsListSchema);

type ChatDelete = {
	msgId: IMessage['_id'];
	roomId: IRoom['_id'];
};

const ChatDeleteSchema: JSONSchemaType<ChatDelete> = {
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

export const isChatDeleteProps = ajv.compile(ChatDeleteSchema);

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

export const isChatReactProps = ajv.compile(ChatReactSchema);

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

export const isChatIgnoreUserProps = ajv.compile(ChatIgnoreUserSchema);

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

export const isChatSearchProps = ajv.compile(ChatSearchSchema);

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

export const isChatUpdateProps = ajv.compile(ChatUpdateSchema);

type ChatGetMessageReadReceipts = {
	messageId: IMessage['_id'];
};

const ChatGetMessageReadReceiptsSchema: JSONSchemaType<ChatGetMessageReadReceipts> = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatGetMessageReadReceiptsProps = ajv.compile(ChatGetMessageReadReceiptsSchema);

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
	'chat.starMessage': {
		POST: (params: ChatStarMessage) => void;
	};
	'chat.unStarMessage': {
		POST: (params: ChatUnstarMessage) => void;
	};
	'chat.pinMessage': {
		POST: (params: ChatPinMessage) => void;
	};
	'chat.unPinMessage': {
		POST: (params: ChatUnpinMessage) => void;
	};
	'chat.reportMessage': {
		POST: (params: ChatReportMessage) => void;
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
	'chat.syncThreadsList': {
		GET: (params: ChatSyncThreadsList) => {
			threads: {
				update: IMessage[];
				remove: IMessage[];
			};
		};
	};
	'chat.delete': {
		POST: (params: ChatDelete) => {
			_id: string;
			ts: string;
			message: Pick<IMessage, '_id' | 'rid' | 'u'>;
		};
	};
	'chat.react': {
		POST: (params: ChatReact) => void;
	};
	'chat.ignoreUser': {
		GET: (params: ChatIgnoreUser) => {};
	};
	'chat.search': {
		GET: (params: ChatSearch) => {
			messages: IMessage[];
		};
	};
	'chat.update': {
		POST: (params: ChatUpdate) => {
			messages: IMessage;
		};
	};
	'chat.getMessageReadReceipts': {
		GET: (params: ChatGetMessageReadReceipts) => { receipts: ReadReceipt[] };
	};
};
