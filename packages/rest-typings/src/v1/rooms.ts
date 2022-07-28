import type { IMessage, IRoom, IUser, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

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

type RoomsInfoProps = { roomId: string } | { roomName: string };

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

type RoomsExportProps = {
	rid: IRoom['_id'];
	type: 'email' | 'file';
	toUsers?: IUser['username'][];
	toEmails?: string[];
	additionalEmails?: string;
	subject?: string;
	messages?: IMessage['_id'][];
	dateFrom?: string;
	dateTo?: string;
	format?: 'html' | 'json';
};

const RoomsExportSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		type: {
			type: 'string',
			nullable: true,
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
			nullable: true,
		},
		dateFrom: {
			type: 'string',
			nullable: true,
		},
		dateTo: {
			type: 'string',
			nullable: true,
		},
		format: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['rid'],
	additionalProperties: false,
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
	},
	required: ['rid'],
	additionalProperties: false,
};

export const isRoomsSaveRoomSettingsProps = ajv.compile<RoomsSaveRoomSettingsProps>(RoomsSaveRoomSettingsSchema);

export type RoomsEndpoints = {
	'/v1/rooms.autocomplete.channelAndPrivate': {
		GET: (params: RoomsAutoCompleteChannelAndPrivateProps) => {
			items: IRoom[];
		};
	};
	'/v1/rooms.autocomplete.channelAndPrivate.withPagination': {
		GET: (params: RoomsAutocompleteChannelAndPrivateWithPaginationProps) => PaginatedResult<{
			items: IRoom[];
		}>;
	};
	'/v1/rooms.autocomplete.availableForTeams': {
		GET: (params: RoomsAutocompleteAvailableForTeamsProps) => {
			items: IRoom[];
		};
	};
	'/v1/rooms.info': {
		GET: (params: RoomsInfoProps) => {
			room: IRoom;
		};
	};
	'/v1/rooms.cleanHistory': {
		POST: (params: {
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
		}) => { _id: IRoom['_id']; count: number; success: boolean };
	};
	'/v1/rooms.createDiscussion': {
		POST: (params: RoomsCreateDiscussionProps) => {
			discussion: IRoom;
		};
	};
	'/v1/rooms.export': {
		POST: (params: RoomsExportProps) => {
			missing?: [];
			success: boolean;
		};
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
		}) => { message: IMessage };
	};
	'/v1/rooms.saveNotification': {
		POST: (params: {
			roomId: string;
			notifications: {
				disableNotifications: string;
				muteGroupMentions: string;
				hideUnreadStatus: string;
				desktopNotifications: string;
				audioNotificationValue: string;
				mobilePushNotifications: string;
				emailNotifications: string;
			};
		}) => {
			success: boolean;
		};
	};
};
