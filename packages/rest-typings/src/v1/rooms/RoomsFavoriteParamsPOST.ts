import { ajv } from '../../Ajv';

export type POSTRoomsFavorite = {
	favorite: string;
};

const POSTRoomsFavoriteSchema = {
	type: 'object',
	properties: {
		favorite: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['favorite'],
};

export const isPOSTRoomsFavorite = ajv.compile<POSTRoomsFavorite>(POSTRoomsFavoriteSchema);
