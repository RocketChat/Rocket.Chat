import { ajv } from '../../Ajv';

export type GETAdminRoomsGetRoom = {
	rid: string;
};

const GETAdminRoomsGetRoomSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

export const isGETAdminRoomsGetRoom = ajv.compile<GETAdminRoomsGetRoom>(GETAdminRoomsGetRoomSchema);
