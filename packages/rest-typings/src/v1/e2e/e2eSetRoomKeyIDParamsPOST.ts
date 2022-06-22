import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type e2eSetRoomKeyIDParamsGET = {
	rid: string;
	keyID: string;
};

const e2eSetRoomKeyIDParamsGETSchema = {
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

export const ise2eSetRoomKeyIDParamsGET = ajv.compile<e2eSetRoomKeyIDParamsGET>(e2eSetRoomKeyIDParamsGETSchema);
