import type Icons from '@rocket.chat/icons';
import type { Root } from '@rocket.chat/message-parser';
import type { MessageSurfaceLayout } from '@rocket.chat/ui-kit';
import * as z from 'zod';

import { ILivechatPrioritySchema } from '../ILivechatPriority';
import type { ILivechatVisitor } from '../ILivechatVisitor';
import { IOmnichannelServiceLevelAgreementsSchema } from '../IOmnichannelServiceLevelAgreements';
import { IRocketChatRecordSchema } from '../IRocketChatRecord';
import { IRoomSchema, type IRoom } from '../IRoom';
import { IUserSchema, type IUser } from '../IUser';
import { serializableDate } from '../utils';
import { FilePropSchema } from './MessageAttachment/Files/FileProp';
import { MessageAttachmentSchema, type MessageAttachment } from './MessageAttachment/MessageAttachment';

export const MessageUrlSchema = z.object({
	url: z.string(),
	source: z.string().optional(),
	meta: z.record(z.string(), z.string()),
	headers: z
		.object({
			contentLength: z.string().optional(),
			contentType: z.string().optional(),
		})
		.optional(),
	ignoreParse: z.boolean().optional(),
	parsedUrl: z
		.object({
			host: z.string().nullable(),
			hash: z.string().nullable(),
			pathname: z.string().nullable(),
			protocol: z.string().nullable(),
			port: z.string().nullable(),
			query: z.union([z.string().nullable(), z.record(z.string(), z.any()).nullable()]),
			search: z.string().nullable(),
			hostname: z.string().nullable(),
		})
		.optional(),
});

export type MessageUrl = z.infer<typeof MessageUrlSchema>;

const TeamMessageTypesValues = [
	'removed-user-from-team',
	'added-user-to-team',
	'ult',
	'user-converted-to-team',
	'user-converted-to-channel',
	'user-removed-room-from-team',
	'user-deleted-room-from-team',
	'user-added-room-to-team',
	'ujt',
] as const;

const LivechatMessageTypesValues = [
	'livechat_navigation_history',
	'livechat_transfer_history',
	'livechat_transcript_history',
	'livechat_video_call',
	'livechat_transfer_history_fallback',
	'livechat-close',
	'livechat-started',
	'omnichannel_priority_change_history',
	'omnichannel_sla_change_history',
	'omnichannel_placed_chat_on_hold',
	'omnichannel_on_hold_chat_resumed',
] as const;

const MessageTypes = [
	'e2e',
	'uj',
	'ui',
	'uir',
	'ul',
	'ru',
	'au',
	'mute_unmute',
	'r',
	'ut',
	'wm',
	'rm',
	'subscription-role-added',
	'subscription-role-removed',
	'room-archived',
	'room-unarchived',
	'room_changed_privacy',
	'room_changed_description',
	'room_changed_announcement',
	'room_changed_avatar',
	'room_changed_topic',
	'room_e2e_enabled',
	'room_e2e_disabled',
	'user-muted',
	'user-unmuted',
	'room-removed-read-only',
	'room-set-read-only',
	'room-allowed-reacting',
	'room-disallowed-reacting',
	'command',
	'videoconf',
	'message_pinned',
	'message_pinned_e2e',
	'new-moderator',
	'moderator-removed',
	'new-owner',
	'owner-removed',
	'new-leader',
	'leader-removed',
	'discussion-created',
	'abac-removed-user-from-room',
	...TeamMessageTypesValues,
	...LivechatMessageTypesValues,
] as const;

export const MessageTypesSchema = z.enum(MessageTypes);

export type MessageTypesValues = z.infer<typeof MessageTypesSchema>;

const TokenTypeSchema = z.enum(['code', 'inlinecode', 'bold', 'italic', 'strike', 'link']);
const TokenExtraSchema = z.object({
	highlight: z.boolean().optional(),
	noHtml: z.string().optional(),
});
const TokenSchema = z
	.object({
		token: z.string(),
		text: z.string(),
		type: TokenTypeSchema.optional(),
	})
	.and(TokenExtraSchema);

export type TokenType = z.infer<typeof TokenTypeSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type TokenExtra = z.infer<typeof TokenExtraSchema>;

const MessageMentionSchema = z.object({
	type: z.enum(['user', 'team']).optional(), // mentions for 'all' and 'here' doesn't have type
	_id: z.string(),
	name: z.string().optional(),
	username: z.string().optional(),
	fname: z.string().optional(), // incase of channel mentions
});

export type MessageMention = z.infer<typeof MessageMentionSchema>;

export interface IMessageCustomFields {}

const IEncryptedContentSchema = z.object({
	algorithm: z.string(),
	ciphertext: z.string(),
});

const IEncryptedContentV1Schema = IEncryptedContentSchema.extend({
	algorithm: z.literal('rc.v1.aes-sha2'),
});

const IEncryptedContentV2Schema = IEncryptedContentSchema.extend({
	algorithm: z.literal('rc.v2.aes-sha2'),
	iv: z.string(), // Initialization Vector
	kid: z.string(), // ID of the key used to encrypt the message
});

const IEncryptedContentFederationSchema = IEncryptedContentSchema.extend({
	algorithm: z.literal('m.megolm.v1.aes-sha2'),
});

const EncryptedContentSchema = z.union([IEncryptedContentV1Schema, IEncryptedContentV2Schema, IEncryptedContentFederationSchema]);

export type EncryptedContent = z.infer<typeof EncryptedContentSchema>;

export const IMessageSchema = IRocketChatRecordSchema.extend({
	rid: z.lazy(() => IRoomSchema.shape._id),
	msg: z.string(),
	tmid: z.string().optional(),
	tshow: z.boolean().optional(),
	ts: serializableDate,
	mentions: z.array(MessageMentionSchema).optional(),

	groupable: z.boolean().optional(),
	channels: z.array(z.lazy(() => IRoomSchema.pick({ _id: true, name: true }))).optional(),
	u: z.object({
		_id: IUserSchema.shape._id,
		username: z.string(),
		name: z.string().optional(),
	}),
	blocks: z.custom<MessageSurfaceLayout>().optional(),
	alias: z.string().optional(),
	md: z.custom<Root>().optional(),

	_hidden: z.boolean().optional(),
	imported: z.boolean().optional(),
	replies: z.array(IUserSchema.shape._id).optional(),
	location: z
		.object({
			type: z.literal('Point'),
			coordinates: z.tuple([z.number(), z.number()]),
		})
		.optional(),
	starred: z.array(IUserSchema.pick({ _id: true })).optional(),
	pinned: z.boolean().optional(),
	pinnedAt: serializableDate.optional(),
	pinnedBy: IUserSchema.pick({ _id: true, username: true }).optional(),
	unread: z.boolean().optional(),
	temp: z.boolean().optional(),
	drid: z.lazy(() => IRoomSchema.shape._id).optional(),
	tlm: serializableDate.optional(),

	dcount: z.number().optional(),
	tcount: z.number().optional(),
	t: z.enum(MessageTypes).optional(),
	e2e: z.enum(['pending', 'done']).optional(),
	e2eMentions: z
		.object({
			e2eUserMentions: z.array(z.string()).optional(),
			e2eChannelMentions: z.array(z.string()).optional(),
		})
		.optional(),

	urls: z.array(MessageUrlSchema).optional(),

	actionLinks: z
		.array(
			z.object({
				icon: z.string() as z.ZodType<keyof typeof Icons>,
				i18nLabel: z.unknown(),
				label: z.string(),
				method_id: z.string(),
				params: z.string(),
			}),
		)
		.optional()
		.meta({ deprecated: true }),

	file: FilePropSchema.optional().meta({ deprecated: true }),
	fileUpload: z
		.object({
			publicFilePath: z.string(),
			type: z.string().optional(),
			size: z.number().optional(),
		})
		.optional(),
	files: z.array(FilePropSchema).optional(),
	attachments: z.array(MessageAttachmentSchema).optional(),

	reactions: z
		.record(
			z.string(),
			z.object({
				names: z.array(z.string()).optional(),
				usernames: z.array(z.string()),
				federationReactionEventIds: z.record(z.string(), z.string()).optional(),
			}),
		)
		.optional(),

	private: z.boolean().optional(),
	bot: z.record(z.string(), z.any()).optional().meta({ deprecated: true }),
	sentByEmail: z.boolean().optional(),
	webRtcCallEndTs: serializableDate.optional(),
	role: z.string().optional(),

	avatar: z.string().optional(),
	emoji: z.string().optional(),

	// Tokenization fields
	tokens: z.array(TokenSchema).optional(),
	html: z.string().optional(),
	// Messages sent from visitors have this field
	token: z.string().optional(),
	federation: z
		.object({
			eventId: z.string(),
			version: z.number().optional(),
		})
		.optional(),

	/* used when message type is "omnichannel_sla_change_history" */
	slaData: z
		.object({
			definedBy: IUserSchema.pick({ _id: true, username: true }),
			sla: IOmnichannelServiceLevelAgreementsSchema.pick({ name: true }).optional(),
		})
		.optional(),

	/* used when message type is "omnichannel_priority_change_history" */
	priorityData: z
		.object({
			definedBy: IUserSchema.pick({ _id: true, username: true }),
			priority: ILivechatPrioritySchema.pick({ name: true, i18n: true }).optional(),
		})
		.optional(),

	customFields: z.custom<IMessageCustomFields>().optional(),

	content: EncryptedContentSchema.optional(),
});

export interface IMessage extends z.infer<typeof IMessageSchema> {}

export type EncryptedMessageContent = Required<Pick<IMessage, 'content'>>;

export function isEncryptedMessageContent(value: unknown): value is EncryptedMessageContent {
	return (
		typeof value === 'object' &&
		value !== null &&
		'content' in value &&
		typeof value.content === 'object' &&
		value.content !== null &&
		'algorithm' in value.content &&
		(value.content.algorithm === 'rc.v1.aes-sha2' || value.content.algorithm === 'rc.v2.aes-sha2') &&
		'ciphertext' in value.content &&
		typeof value.content.ciphertext === 'string' &&
		(value.content.algorithm === 'rc.v1.aes-sha2' ||
			(value.content.algorithm === 'rc.v2.aes-sha2' &&
				'iv' in value.content &&
				typeof value.content.iv === 'string' &&
				'kid' in value.content &&
				typeof value.content.kid === 'string'))
	);
}
export interface ISystemMessage extends IMessage {
	t: MessageTypesValues;
}

export interface IEditedMessage extends IMessage {
	editedAt: Date;
	editedBy: Pick<IUser, '_id' | 'username'>;
}

export const isEditedMessage = (message: IMessage): message is IEditedMessage =>
	'editedAt' in message &&
	(message as { editedAt?: unknown }).editedAt instanceof Date &&
	'editedBy' in message &&
	typeof (message as { editedBy?: unknown }).editedBy === 'object' &&
	(message as { editedBy?: unknown }).editedBy !== null &&
	'_id' in (message as IEditedMessage).editedBy &&
	typeof (message as IEditedMessage).editedBy._id === 'string';

export const isSystemMessage = (message: IMessage): message is ISystemMessage =>
	message.t !== undefined && MessageTypes.includes(message.t);

export const isDeletedMessage = (message: IMessage): message is IEditedMessage => isEditedMessage(message) && message.t === 'rm';

export interface IFederatedMessage extends IMessage {
	federation: {
		eventId: string;
	};
}

export interface INativeFederatedMessage extends IMessage {
	federation: {
		version: number;
		eventId: string;
	};
}

export const isMessageFromMatrixFederation = (message: IMessage): message is IFederatedMessage =>
	'federation' in message && Boolean(message.federation?.eventId);

export const isMessageFromNativeFederation = (message: IMessage): message is INativeFederatedMessage =>
	isMessageFromMatrixFederation(message) && 'version' in message.federation;

export interface ITranslatedMessage extends IMessage {
	translations: { [key: string]: string } & { original?: string };
	translationProvider: string;
	autoTranslateShowInverse?: boolean;
	autoTranslateFetching?: boolean;
}

export const isTranslatedMessage = (message: IMessage): message is ITranslatedMessage => 'translations' in message;

export const IThreadMainMessageSchema = IMessageSchema.extend({
	tcount: z.number(),
	tlm: serializableDate,
	replies: z.array(IUserSchema.shape._id),
});

export interface IThreadMainMessage extends z.infer<typeof IThreadMainMessageSchema> {}

export const IThreadMessageSchema = IMessageSchema.extend({
	tmid: z.string(),
});

export interface IThreadMessage extends z.infer<typeof IThreadMessageSchema> {}

export const isThreadMainMessage = (message: IMessage): message is IThreadMainMessage => 'tcount' in message && 'tlm' in message;

export const isThreadMessage = (message: IMessage): message is IThreadMessage => !!message.tmid;

export interface IDiscussionMessage extends IMessage {
	drid: string;
	dlm?: Date;
	dcount: number;
}

export const isDiscussionMessage = (message: IMessage): message is IDiscussionMessage => !!message.drid;

export interface IPrivateMessage extends IMessage {
	private: true;
}

export const isPrivateMessage = (message: IMessage): message is IPrivateMessage => !!message.private;

export interface IMessageReactionsNormalized extends IMessage {
	reactions: {
		[key: string]: {
			usernames: Required<IUser['_id']>[];
			names: Required<IUser>['name'][];
		};
	};
}

export interface IOmnichannelSystemMessage extends IMessage {
	navigation?: {
		page: {
			title: string;
			location: {
				href: string;
			};
			token?: string;
		};
	};
	transferData?: {
		comment: string;
		transferredBy: {
			name?: string;
			username: string;
		};
		transferredTo: {
			name?: string;
			username: string;
		};
		nextDepartment?: {
			_id: string;
			name?: string;
		};
		scope: 'department' | 'agent' | 'queue';
	};
	requestData?: {
		type: 'visitor' | 'user';
		visitor?: ILivechatVisitor;
		user?: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset'> | null;
	};
	webRtcCallEndTs?: Date;
	comment?: string;
}

export interface IMessageDiscussion extends IMessage {
	drid: IRoom['_id'];
}

export const isMessageDiscussion = (message: IMessage): message is IMessageDiscussion => {
	return 'drid' in message;
};

export type IMessageInbox = IMessage & {
	// email inbox fields
	email?: {
		references?: string[];
		messageId?: string;
		thread?: string[];
	};
};

export const isIMessageInbox = (message: IMessage): message is IMessageInbox => 'email' in message;

export type IE2EEMessage = IMessage & {
	t: 'e2e';
	e2e: 'pending' | 'done';
	content: EncryptedContent;
};

export type IE2EEPinnedMessage = IMessage & {
	t: 'message_pinned_e2e';
	attachments: [MessageAttachment & { content: EncryptedContent }];
};

export type IVideoConfMessage = IMessage & {
	t: 'videoconf';
};

export const isE2EEMessage = (message: IMessage): message is IE2EEMessage => message.t === 'e2e';
export const isE2EEPinnedMessage = (message: IMessage): message is IE2EEPinnedMessage => message.t === 'message_pinned_e2e';
export const isVideoConfMessage = (message: IMessage): message is IVideoConfMessage => message.t === 'videoconf';

export type IMessageWithPendingFileImport = IMessage & {
	_importFile: {
		downloadUrl: string;
		id: string;
		size: number;
		name: string;
		external: boolean;
		source: 'slack' | 'hipchat-enterprise';
		original: Record<string, any>;
		rocketChatUrl?: string;
		downloaded?: boolean;
	};
};

export interface IMessageFromVisitor extends IMessage {
	token: string;
}

export const isMessageFromVisitor = (message: IMessage): message is IMessageFromVisitor => 'token' in message;
