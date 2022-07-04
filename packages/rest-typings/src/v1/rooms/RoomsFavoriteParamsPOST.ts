import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsFavoriteParamsPOST = {
	favorite: string;
};

const RoomsFavoriteParamsPOSTSchema = {
	type: 'object',
	properties: {
		favorite: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['favorite'],
};

export const isRoomsFavoriteParamsPOST = ajv.compile<RoomsFavoriteParamsPOST>(RoomsFavoriteParamsPOSTSchema);
