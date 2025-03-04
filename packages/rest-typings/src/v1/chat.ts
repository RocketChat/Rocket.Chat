import type {
	IMessage,
	IRoom,
	MessageAttachment,
	ReadReceipt,
	OtrSystemMessages,
	MessageUrl,
	IThreadMainMessage,
} from '@rocket.chat/core-typings';

import { ajv } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

type ChatSendMessage = {
	message: Partial<IMessage>;
	previewUrls?: string[];
};

const chatSendMessageSchema = {
	type: 'object',
	properties: {
		message: {
			type: 'object',
			properties: {
				_id: {
					type: 'string',
					nullable: true,
				},
				rid: {
					type: 'string',
				},
				tmid: {
					type: 'string',
					nullable: true,
				},
				msg: {
					type: 'string',
					nullable: true,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
				tshow: {
					type: 'boolean',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				attachments: {
					type: 'array',
					items: {
						type: 'object',
					},
					nullable: true,
				},
				blocks: {
					type: 'array',
					items: {
						type: 'object',
					},
					nullable: true,
				},
				customFields: {
					type: 'object',
					nullable: true,
				},
			},
		},
		previewUrls: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
	},
	required: ['message'],
	additionalProperties: false,
};

export const isChatSendMessageProps = ajv.compile<ChatSendMessage>(chatSendMessageSchema);

type ChatFollowMessage = {
	mid: IMessage['_id'];
};

const chatFollowMessageSchema = {
	type: 'object',
	properties: {
		mid: {
			type: 'string',
			minLength: 1,
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
			minLength: 1,
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
			minLength: 1,
		},
	},
	required: ['msgId'],
	additionalProperties: false,
};

export const isChatGetMessageProps = ajv.compile<ChatGetMessage>(ChatGetMessageSchema);

type ChatStarMessage = {
	messageId: IMessage['_id'];
};

const ChatStarMessageSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatStarMessageProps = ajv.compile<ChatStarMessage>(ChatStarMessageSchema);

type ChatUnstarMessage = {
	messageId: IMessage['_id'];
};

const ChatUnstarMessageSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatUnstarMessageProps = ajv.compile<ChatUnstarMessage>(ChatUnstarMessageSchema);

type ChatPinMessage = {
	messageId: IMessage['_id'];
};

const ChatPinMessageSchema = {
	type: 'object',
	properties: {
		messageId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['messageId'],
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
			minLength: 1,
		},
	},
	required: ['messageId'],
	additionalProperties: false,
};

export const isChatUnpinMessageProps = ajv.compile<ChatUnpinMessage>(ChatUnpinMessageSchema);

type ChatGetDiscussions = PaginatedRequest<{
	roomId: IRoom['_id'];
	text?: string;
}>;

const ChatGetDiscussionsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		text: {
			type: 'string',
		},
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
	},
	required: ['roomId'],
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

type ChatGetThreadsList = PaginatedRequest<{
	rid: IRoom['_id'];
	type?: 'unread' | 'following';
	text?: string;
	fields?: string;
}>;

const ChatGetThreadsListSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		type: {
			type: 'string',
			enum: ['following', 'unread'],
			nullable: true,
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
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
		fields: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['rid'],
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
			minLength: 1,
		},
		updatedSince: {
			type: 'string',
			format: 'iso-date-time',
		},
	},
	required: ['rid', 'updatedSince'],
	additionalProperties: false,
};

export const isChatSyncThreadsListProps = ajv.compile<ChatSyncThreadsList>(ChatSyncThreadsListSchema);

type ChatDelete = {
	msgId: IMessage['_id'];
	roomId: IRoom['_id'];
	asUser?: boolean;
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
		asUser: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['msgId', 'roomId'],
	additionalProperties: false,
};

export const isChatDeleteProps = ajv.compile<ChatDelete>(ChatDeleteSchema);

type ChatReact =
	| { emoji: string; messageId: IMessage['_id']; shouldReact?: boolean }
	| { reaction: string; messageId: IMessage['_id']; shouldReact?: boolean };

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
					minLength: 1,
				},
				shouldReact: {
					type: 'boolean',
					nullable: true,
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
					minLength: 1,
				},
				shouldReact: {
					type: 'boolean',
					nullable: true,
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
			minLength: 1,
		},
		userId: {
			type: 'string',
			minLength: 1,
		},
		ignore: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['rid', 'userId', 'ignore'],
	additionalProperties: false,
};

export const isChatIgnoreUserProps = ajv.compile<ChatIgnoreUser>(ChatIgnoreUserSchema);

type ChatSearch = PaginatedRequest<{
	roomId: IRoom['_id'];
	searchText: string;
}>;

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
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['roomId', 'searchText'],
	additionalProperties: false,
};

export const isChatSearchProps = ajv.compile<ChatSearch>(ChatSearchSchema);

type ChatUpdate = {
	roomId: IRoom['_id'];
	msgId: string;
	text: string;
	previewUrls?: string[];
	customFields: IMessage['customFields'];
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
		previewUrls: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		customFields: {
			type: 'object',
			nullable: true,
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

type GetStarredMessages = {
	roomId: IRoom['_id'];
	count?: number;
	offset?: number;
	sort?: string;
};

const GetStarredMessagesSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChatGetStarredMessagesProps = ajv.compile<GetStarredMessages>(GetStarredMessagesSchema);

type GetPinnedMessages = {
	roomId: IRoom['_id'];
	count?: number;
	offset?: number;
	sort?: string;
};

const GetPinnedMessagesSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChatGetPinnedMessagesProps = ajv.compile<GetPinnedMessages>(GetPinnedMessagesSchema);

type GetMentionedMessages = {
	roomId: IRoom['_id'];
	count?: number;
	offset?: number;
	sort?: string;
};

const GetMentionedMessagesSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChatGetMentionedMessagesProps = ajv.compile<GetMentionedMessages>(GetMentionedMessagesSchema);

type ChatSyncMessages = {
	roomId: IRoom['_id'];
	lastUpdate?: string;
	count?: number;
	next?: string;
	previous?: string;
	type?: 'UPDATED' | 'DELETED';
};

const ChatSyncMessagesSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		lastUpdate: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		next: {
			type: 'string',
			nullable: true,
		},
		previous: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			enum: ['UPDATED', 'DELETED'],
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isChatSyncMessagesProps = ajv.compile<ChatSyncMessages>(ChatSyncMessagesSchema);

type ChatSyncThreadMessages = PaginatedRequest<{
	tmid: string;
	updatedSince: string;
}>;

const ChatSyncThreadMessagesSchema = {
	type: 'object',
	properties: {
		tmid: {
			type: 'string',
			minLength: 1,
		},
		updatedSince: {
			type: 'string',
			format: 'iso-date-time',
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['tmid', 'updatedSince'],
	additionalProperties: false,
};

export const isChatSyncThreadMessagesProps = ajv.compile<ChatSyncThreadMessages>(ChatSyncThreadMessagesSchema);

type ChatGetThreadMessages = PaginatedRequest<{
	tmid: string;
}>;

const ChatGetThreadMessagesSchema = {
	type: 'object',
	properties: {
		tmid: {
			type: 'string',
			minLength: 1,
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['tmid'],
	additionalProperties: false,
};

export const isChatGetThreadMessagesProps = ajv.compile<ChatGetThreadMessages>(ChatGetThreadMessagesSchema);

type ChatGetDeletedMessages = PaginatedRequest<{
	roomId: IRoom['_id'];
	since: string;
}>;

const ChatGetDeletedMessagesSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		since: {
			type: 'string',
			minLength: 1,
			format: 'iso-date-time',
		},
		count: {
			type: 'number',
			nullable: true,
		},
		offset: {
			type: 'number',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId', 'since'],
	additionalProperties: false,
};

export const isChatGetDeletedMessagesProps = ajv.compile<ChatGetDeletedMessages>(ChatGetDeletedMessagesSchema);

type ChatPostMessage =
	| {
			roomId: string | string[];
			text?: string;
			alias?: string;
			emoji?: string;
			avatar?: string;
			attachments?: MessageAttachment[];
			customFields?: IMessage['customFields'];
	  }
	| {
			channel: string | string[];
			text?: string;
			alias?: string;
			emoji?: string;
			avatar?: string;
			attachments?: MessageAttachment[];
			customFields?: IMessage['customFields'];
	  };

const ChatPostMessageSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					oneOf: [
						{ type: 'string' },
						{
							type: 'array',
							items: {
								type: 'string',
							},
						},
					],
				},
				text: {
					type: 'string',
					nullable: true,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				attachments: {
					type: 'array',
					items: {
						type: 'object',
					},
					nullable: true,
				},
				tmid: {
					type: 'string',
				},
				customFields: {
					type: 'object',
					nullable: true,
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				channel: {
					oneOf: [
						{ type: 'string' },
						{
							type: 'array',
							items: {
								type: 'string',
							},
						},
					],
				},
				text: {
					type: 'string',
					nullable: true,
				},
				alias: {
					type: 'string',
					nullable: true,
				},
				emoji: {
					type: 'string',
					nullable: true,
				},
				avatar: {
					type: 'string',
					nullable: true,
				},
				attachments: {
					type: 'array',
					items: {
						type: 'object',
					},
					nullable: true,
				},
				customFields: {
					type: 'object',
					nullable: true,
				},
			},
			required: ['channel'],
			additionalProperties: false,
		},
	],
};

export const isChatPostMessageProps = ajv.compile<ChatPostMessage>(ChatPostMessageSchema);

type ChatGetURLPreview = {
	roomId: IRoom['_id'];
	url: string;
};

const ChatGetURLPreviewSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		url: {
			type: 'string',
		},
	},
	required: ['roomId', 'url'],
	additionalProperties: false,
};

export const isChatGetURLPreviewProps = ajv.compile<ChatGetURLPreview>(ChatGetURLPreviewSchema);

type ChatOTR = { roomId: string; type: OtrSystemMessages };
const ChatOTRSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		type: {
			type: 'string',
			enum: ['user_joined_otr', 'user_requested_otr_key_refresh', 'user_key_refreshed_successfully'],
		},
	},
	required: ['roomId', 'type'],
	additionalProperties: false,
};
export const isChatOTRProps = ajv.compile<ChatOTR>(ChatOTRSchema);

export type ChatEndpoints = {
	'/v1/chat.sendMessage': {
		POST: (params: ChatSendMessage) => {
			message: IMessage;
		};
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
		POST: (params: ChatPinMessage) => {
			message: IMessage;
		};
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
			threads: IThreadMainMessage[];
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
			message: IMessage;
		};
	};
	'/v1/chat.getMessageReadReceipts': {
		GET: (params: ChatGetMessageReadReceipts) => { receipts: ReadReceipt[] };
	};
	'/v1/chat.getStarredMessages': {
		GET: (params: GetStarredMessages) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.getPinnedMessages': {
		GET: (params: GetPinnedMessages) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.getMentionedMessages': {
		GET: (params: GetMentionedMessages) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.syncMessages': {
		GET: (params: ChatSyncMessages) => {
			result: {
				updated: IMessage[];
				deleted: IMessage[];
				cursor: {
					next: string | null;
					previous: string | null;
				};
			};
		};
	};
	'/v1/chat.postMessage': {
		POST: (params: ChatPostMessage) => {
			ts: number;
			channel: IRoom;
			message: IMessage;
		};
	};
	'/v1/chat.syncThreadMessages': {
		GET: (params: ChatSyncThreadMessages) => {
			messages: {
				update: IMessage[];
				remove: IMessage[];
			};
		};
	};
	'/v1/chat.getThreadMessages': {
		GET: (params: ChatGetThreadMessages) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.getDeletedMessages': {
		GET: (params: ChatGetDeletedMessages) => {
			messages: IMessage[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/chat.otr': {
		POST: (params: ChatOTR) => void;
	};
	'/v1/chat.getURLPreview': {
		GET: (params: ChatGetURLPreview) => { urlPreview: MessageUrl };
	};
};
