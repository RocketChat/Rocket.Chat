import type { IMessage, IRoom, IUser, RoomAdminFieldsType, IUpload, IE2EEMessage, ITeam, IRole } from '@rocket.chat/core-typings';

import { ajv } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

type RoomsAutoCompleteChannelAndPrivateProps = { selector: string };

const RoomsAutoCompleteChannelAndPrivateSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isRoomsAutoCompleteChannelAndPrivateProps = ajv.compile<RoomsAutoCompleteChannelAndPrivateProps>(
	RoomsAutoCompleteChannelAndPrivateSchema,
);

type RoomsAutocompleteChannelAndPrivateWithPaginationProps = PaginatedRequest<{ selector: string }>;

const RoomsAutocompleteChannelAndPrivateWithPaginationSchema = {
	type: 'object',
	properties: {
		selector: {
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
		sort: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isRoomsAutocompleteChannelAndPrivateWithPaginationProps = ajv.compile<RoomsAutocompleteChannelAndPrivateWithPaginationProps>(
	RoomsAutocompleteChannelAndPrivateWithPaginationSchema,
);

type RoomsAutocompleteAvailableForTeamsProps = { name: string };

const RoomsAutocompleteAvailableForTeamsSchema = {
	type: 'object',
	properties: {
		name: {
			type: 'string',
		},
	},
	required: ['name'],
	additionalProperties: false,
};

export const isRoomsAutocompleteAvailableForTeamsProps = ajv.compile<RoomsAutocompleteAvailableForTeamsProps>(
	RoomsAutocompleteAvailableForTeamsSchema,
);

type RoomsAutocompleteAdminRoomsPayload = { selector: string };

const RoomsAutocompleteAdminRoomsPayloadSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isRoomsAutocompleteAdminRoomsPayload = ajv.compile<RoomsAutocompleteAdminRoomsPayload>(
	RoomsAutocompleteAdminRoomsPayloadSchema,
);

type BaseRoomsProps = { roomId: string } | { roomName: string };
type RoomsInfoProps = BaseRoomsProps;
type RoomsLeaveProps = BaseRoomsProps;

const RoomsInfoSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				roomName: {
					type: 'string',
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isRoomsInfoProps = ajv.compile<RoomsInfoProps>(RoomsInfoSchema);

type RoomsCreateDiscussionProps = {
	prid: IRoom['_id'];
	pmid?: IMessage['_id'];
	t_name: string; // IRoom['fname']
	users?: IUser['username'][];
	encrypted?: boolean;
	reply?: string;
	topic?: string;
};

const RoomsCreateDiscussionSchema = {
	type: 'object',
	properties: {
		prid: {
			type: 'string',
		},
		pmid: {
			type: 'string',
			nullable: true,
		},
		t_name: {
			type: 'string',
			nullable: true,
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		encrypted: {
			type: 'boolean',
			nullable: true,
		},
		reply: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['prid', 't_name'],
	additionalProperties: false,
};

export const isRoomsCreateDiscussionProps = ajv.compile<RoomsCreateDiscussionProps>(RoomsCreateDiscussionSchema);

type RoomsExportProps = RoomsExportFileProps | RoomsExportEmailProps;

type RoomsExportFileProps = {
	rid: IRoom['_id'];
	type: 'file';
	format: 'html' | 'json';
	dateFrom?: string;
	dateTo?: string;
};

type RoomsExportEmailProps = {
	rid: IRoom['_id'];
	type: 'email';
	toUsers?: IUser['username'][];
	toEmails?: string[];
	additionalEmails?: string;
	subject?: string;
	messages: IMessage['_id'][];
};

const RoomsExportSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				rid: {
					type: 'string',
				},
				type: {
					type: 'string',
					enum: ['file'],
				},
				format: {
					type: 'string',
					enum: ['html', 'json'],
				},
				dateFrom: {
					type: 'string',
					nullable: true,
					format: 'date',
				},
				dateTo: {
					type: 'string',
					nullable: true,
					format: 'date',
				},
			},
			required: ['rid', 'type', 'format'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				rid: {
					type: 'string',
				},
				type: {
					type: 'string',
					enum: ['email'],
				},
				toUsers: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				toEmails: {
					type: 'array',
					items: {
						type: 'string',
					},
					nullable: true,
				},
				additionalEmails: {
					type: 'string',
					nullable: true,
				},
				subject: {
					type: 'string',
					nullable: true,
				},
				messages: {
					type: 'array',
					items: {
						type: 'string',
					},
					minItems: 1,
				},
			},
			required: ['rid', 'type', 'messages'],
			additionalProperties: false,
		},
	],
};

export const isRoomsExportProps = ajv.compile<RoomsExportProps>(RoomsExportSchema);

type RoomsAdminRoomsProps = PaginatedRequest<{
	filter?: string;
	types?: string[];
}>;

const RoomsAdminRoomsSchema = {
	type: 'object',
	properties: {
		filter: {
			type: 'string',
			nullable: true,
		},
		types: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
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
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isRoomsAdminRoomsProps = ajv.compile<RoomsAdminRoomsProps>(RoomsAdminRoomsSchema);

type RoomsAdminRoomsGetRoomProps = { rid?: string };

const RoomsAdminRoomsGetRoomSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isRoomsAdminRoomsGetRoomProps = ajv.compile<RoomsAdminRoomsGetRoomProps>(RoomsAdminRoomsGetRoomSchema);

type RoomsChangeArchivationStateProps = { rid: string; action?: string };

const RoomsChangeArchivationStateSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		action: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isRoomsChangeArchivationStateProps = ajv.compile<RoomsChangeArchivationStateProps>(RoomsChangeArchivationStateSchema);

type RoomsSaveRoomSettingsProps = {
	rid: string;
	roomAvatar?: string;
	featured?: boolean;
	roomName?: string;
	roomTopic?: string;
	roomAnnouncement?: string;
	roomDescription?: string;
	roomType?: IRoom['t'];
	readOnly?: boolean;
	reactWhenReadOnly?: boolean;
	default?: boolean;
	encrypted?: boolean;
	favorite?: {
		defaultValue?: boolean;
		favorite?: boolean;
	};
	retentionEnabled?: boolean;
	retentionMaxAge?: number;
	retentionExcludePinned?: boolean;
	retentionFilesOnly?: boolean;
	retentionIgnoreThreads?: boolean;
	retentionOverrideGlobal?: boolean;
};

const RoomsSaveRoomSettingsSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		roomAvatar: {
			type: 'string',
			nullable: true,
		},
		featured: {
			type: 'boolean',
			nullable: true,
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		roomTopic: {
			type: 'string',
			nullable: true,
		},
		roomAnnouncement: {
			type: 'string',
			nullable: true,
		},
		roomDescription: {
			type: 'string',
			nullable: true,
		},
		roomType: {
			type: 'string',
			nullable: true,
		},
		readOnly: {
			type: 'boolean',
			nullable: true,
		},
		reactWhenReadOnly: {
			type: 'boolean',
			nullable: true,
		},
		default: {
			type: 'boolean',
			nullable: true,
		},
		encrypted: {
			type: 'boolean',
			nullable: true,
		},
		favorite: {
			type: 'object',
			properties: {
				defaultValue: {
					type: 'boolean',
					nullable: true,
				},
				favorite: {
					type: 'boolean',
					nullable: true,
				},
			},
			nullable: true,
		},
		retentionEnabled: { type: 'boolean', nullable: true },
		retentionMaxAge: { type: 'number', nullable: true },
		retentionExcludePinned: { type: 'boolean', nullable: true },
		retentionFilesOnly: { type: 'boolean', nullable: true },
		retentionIgnoreThreads: { type: 'boolean', nullable: true },
		retentionOverrideGlobal: { type: 'boolean', nullable: true },
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isRoomsSaveRoomSettingsProps = ajv.compile<RoomsSaveRoomSettingsProps>(RoomsSaveRoomSettingsSchema);

type GETRoomsNameExists = {
	roomName: string;
};

const GETRoomsNameExistsSchema = {
	type: 'object',
	properties: {
		roomName: {
			type: 'string',
		},
	},
	required: ['roomName'],
	additionalProperties: false,
};

export const isGETRoomsNameExists = ajv.compile<GETRoomsNameExists>(GETRoomsNameExistsSchema);

type RoomsIsMemberProps = { roomId: string } & ({ username: string } | { userId: string });

const RoomsIsMemberPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		userId: { type: 'string', minLength: 1 },
		username: { type: 'string', minLength: 1 },
	},
	oneOf: [{ required: ['roomId', 'userId'] }, { required: ['roomId', 'username'] }],
	additionalProperties: false,
};

export const isRoomsIsMemberProps = ajv.compile<RoomsIsMemberProps>(RoomsIsMemberPropsSchema);

export type Notifications = {
	disableNotifications: string;
	muteGroupMentions: string;
	hideUnreadStatus: string;
	desktopNotifications: string;
	audioNotificationValue: string;
	mobilePushNotifications: string;
	emailNotifications: string;
};

type RoomsGetDiscussionsProps = PaginatedRequest<BaseRoomsProps>;

type RoomsMuteUnmuteUser = { userId: string; roomId: string } | { username: string; roomId: string };

const RoomsMuteUnmuteUserSchema = {
	type: 'object',
	oneOf: [
		{
			properties: {
				userId: {
					type: 'string',
					minLength: 1,
				},
				roomId: {
					type: 'string',
					minLength: 1,
				},
			},
			required: ['userId', 'roomId'],
			additionalProperties: false,
		},
		{
			properties: {
				username: {
					type: 'string',
					minLength: 1,
				},
				roomId: {
					type: 'string',
					minLength: 1,
				},
			},
			required: ['username', 'roomId'],
			additionalProperties: false,
		},
	],
};

export const isRoomsMuteUnmuteUserProps = ajv.compile<RoomsMuteUnmuteUser>(RoomsMuteUnmuteUserSchema);
export type RoomsImagesProps = {
	roomId: string;
	startingFromId?: string;
	count?: number;
	offset?: number;
};
const roomsImagesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		startingFromId: {
			type: 'string',
			nullable: true,
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
	required: ['roomId'],
	additionalProperties: false,
};

export const isRoomsImagesProps = ajv.compile<RoomsImagesProps>(roomsImagesPropsSchema);

export type RoomsCleanHistoryProps = {
	roomId: IRoom['_id'];
	latest: string;
	oldest: string;
	inclusive?: boolean;
	excludePinned?: boolean;
	filesOnly?: boolean;
	users?: IUser['username'][];
	limit?: number;
	ignoreDiscussion?: boolean;
	ignoreThreads?: boolean;
};

const roomsCleanHistorySchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		latest: {
			type: 'string',
		},
		oldest: {
			type: 'string',
		},
		inclusive: {
			type: 'boolean',
		},
		excludePinned: {
			type: 'boolean',
		},
		filesOnly: {
			type: 'boolean',
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		limit: {
			type: 'number',
		},
		ignoreDiscussion: {
			type: 'boolean',
		},
		ignoreThreads: {
			type: 'boolean',
		},
	},
	required: ['roomId', 'latest', 'oldest'],
	additionalProperties: false,
};

export const isRoomsCleanHistoryProps = ajv.compile<RoomsCleanHistoryProps>(roomsCleanHistorySchema);

type RoomsOpenProps = {
	roomId: string;
};

const roomsOpenSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isRoomsOpenProps = ajv.compile<RoomsOpenProps>(roomsOpenSchema);

type MembersOrderedByRoleProps = {
	roomId?: IRoom['_id'];
	roomName?: IRoom['name'];
	status?: string[];
	filter?: string;
};

export type RoomsMembersOrderedByRoleProps = PaginatedRequest<MembersOrderedByRoleProps>;

const membersOrderedByRoleRolePropsSchema = {
	properties: {
		roomId: {
			type: 'string',
		},
		roomName: {
			type: 'string',
		},
		status: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		filter: {
			type: 'string',
		},
		count: {
			type: 'integer',
		},
		offset: {
			type: 'integer',
		},
		sort: {
			type: 'string',
		},
	},
	oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	additionalProperties: false,
};

export const isRoomsMembersOrderedByRoleProps = ajv.compile<RoomsMembersOrderedByRoleProps>(membersOrderedByRoleRolePropsSchema);

type RoomsHideProps = {
	roomId: string;
};

const roomsHideSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isRoomsHideProps = ajv.compile<RoomsHideProps>(roomsHideSchema);

export type RoomsEndpoints = {
	'/v1/rooms.autocomplete.channelAndPrivate': {
		GET: (params: RoomsAutoCompleteChannelAndPrivateProps) => {
			items: IRoom[];
		};
	};

	'/v1/rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: RoomsAutocompleteChannelAndPrivateWithPaginationProps) => {
			items: IRoom[];
			total: number;
		};
	};

	'/v1/rooms.autocomplete.availableForTeams': {
		GET: (params: RoomsAutocompleteAvailableForTeamsProps) => {
			items: IRoom[];
		};
	};
	'/v1/rooms.autocomplete.adminRooms': {
		GET: (params: RoomsAutocompleteAdminRoomsPayload) => {
			items: IRoom[];
		};
	};

	'/v1/rooms.info': {
		GET: (params: RoomsInfoProps) => {
			room: IRoom | undefined;
			parent?: Pick<IRoom, '_id' | 'name' | 'fname' | 't' | 'prid' | 'u' | 'sidepanel'>;
			team?: Pick<ITeam, 'name' | 'roomId' | 'type' | '_id'>;
		};
	};

	'/v1/rooms.cleanHistory': {
		POST: (params: RoomsCleanHistoryProps) => { _id: IRoom['_id']; count: number; success: boolean };
	};

	'/v1/rooms.createDiscussion': {
		POST: (params: RoomsCreateDiscussionProps) => {
			discussion: IRoom & { rid: IRoom['_id'] };
		};
	};

	'/v1/rooms.export': {
		POST: (params: RoomsExportProps) => {
			missing?: string[];
			success: boolean;
		} | void;
	};

	'/v1/rooms.adminRooms': {
		GET: (params: RoomsAdminRoomsProps) => PaginatedResult<{ rooms: Pick<IRoom, RoomAdminFieldsType>[] }>;
	};

	'/v1/rooms.adminRooms.getRoom': {
		GET: (params: RoomsAdminRoomsGetRoomProps) => Pick<IRoom, RoomAdminFieldsType>;
	};

	'/v1/rooms.saveRoomSettings': {
		POST: (params: RoomsSaveRoomSettingsProps) => {
			success: boolean;
			rid: string;
		};
	};

	'/v1/rooms.changeArchivationState': {
		POST: (params: RoomsChangeArchivationStateProps) => {
			success: boolean;
		};
	};

	'/v1/rooms.upload/:rid': {
		POST: (params: {
			file: File;
			description?: string;
			avatar?: string;
			emoji?: string;
			alias?: string;
			groupable?: boolean;
			msg?: string;
			tmid?: string;
			customFields?: string;
		}) => { message: IMessage | null };
	};

	'/v1/rooms.media/:rid': {
		POST: (params: { file: File }) => { file: { url: string } };
	};

	'/v1/rooms.mediaConfirm/:rid/:fileId': {
		POST: (params: {
			description?: string;
			avatar?: string;
			emoji?: string;
			alias?: string;
			groupable?: boolean;
			msg?: string;
			tmid?: string;
			customFields?: string;
			t?: IMessage['t'];
			content?: IE2EEMessage['content'];
		}) => { message: IMessage | null };
	};

	'/v1/rooms.saveNotification': {
		POST: (params: { roomId: string; notifications: Notifications }) => void;
	};

	'/v1/rooms.favorite': {
		POST: (
			params:
				| {
						roomId: string;
						favorite: boolean;
				  }
				| {
						roomName: string;
						favorite: boolean;
				  },
		) => void;
	};

	'/v1/rooms.nameExists': {
		GET: (params: { roomName: string }) => {
			exists: boolean;
		};
	};

	'/v1/rooms.delete': {
		POST: (params: { roomId: string }) => void;
	};

	'/v1/rooms.get': {
		GET: (params: { updatedSince: string }) => {
			update: IRoom[];
			remove: IRoom[];
		};
	};

	'/v1/rooms.leave': {
		POST: (params: RoomsLeaveProps) => void;
	};

	'/v1/rooms.getDiscussions': {
		GET: (params: RoomsGetDiscussionsProps) => PaginatedResult<{
			discussions: IRoom[];
		}>;
	};

	'/v1/rooms.isMember': {
		GET: (params: RoomsIsMemberProps) => { isMember: boolean };
	};

	'/v1/rooms.muteUser': {
		POST: (params: RoomsMuteUnmuteUser) => void;
	};

	'/v1/rooms.unmuteUser': {
		POST: (params: RoomsMuteUnmuteUser) => void;
	};

	'/v1/rooms.images': {
		GET: (params: RoomsImagesProps) => PaginatedResult<{
			files: IUpload[];
		}>;
	};

	'/v1/rooms.open': {
		POST: (params: RoomsOpenProps) => void;
	};

	'/v1/rooms.membersOrderedByRole': {
		GET: (params: RoomsMembersOrderedByRoleProps) => PaginatedResult<{
			members: (IUser & { roles?: IRole['_id'][] })[];
		}>;
	};

	'/v1/rooms.hide': {
		POST: (params: RoomsHideProps) => void;
	};
};
