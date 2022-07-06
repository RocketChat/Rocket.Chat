import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsAdminRoomsGetRoomParamsGET = {
	rid: string;
};

const RoomsAdminRoomsGetRoomParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

export const isRoomsAdminRoomsGetRoomParamsGET = ajv.compile<RoomsAdminRoomsGetRoomParamsGET>(RoomsAdminRoomsGetRoomParamsGETSchema);
