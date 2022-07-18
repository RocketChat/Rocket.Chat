import { ajv } from '../../Ajv';

export type POSTSaveRoomSettings = {
	rid: string;
	roomAvatar?: string;
	featured?: boolean;
	roomName?: string;
	roomTopic?: string;
	roomAnnouncement?: string;
	roomDescription?: string;
	roomType?: 'c' | 'd' | 'p' | 'l' | 'v';
	readOnly?: boolean;
	reactWhenReadOnly?: boolean;
	default?: boolean;
	encrypted?: boolean;
	favorite?: {
		defaultValue?: boolean;
		favorite?: boolean;
	};
};

const POSTSaveRoomSettingsSchema = {
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
			enum: ['c', 'd', 'p', 'l', 'v'],
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
	additionalProperties: false,
	required: ['rid'],
};

export const isPOSTSaveRoomSettings = ajv.compile<POSTSaveRoomSettings>(POSTSaveRoomSettingsSchema);
