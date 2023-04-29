import { ajv } from '../../helpers/schemas';

export type e2eSetRoomKeyIDParamsPOST = {
	rid: string;
	keyID: string;
};

const e2eSetRoomKeyIDParamsPOSTSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		keyID: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid', 'keyID'],
};

export const ise2eSetRoomKeyIDParamsPOST = ajv.compile<e2eSetRoomKeyIDParamsPOST>(e2eSetRoomKeyIDParamsPOSTSchema);
