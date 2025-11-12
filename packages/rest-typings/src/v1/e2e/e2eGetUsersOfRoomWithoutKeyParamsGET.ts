import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type e2eGetUsersOfRoomWithoutKeyParamsGET = {
	rid: string;
	key: string;
};

const e2eGetUsersOfRoomWithoutKeyParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		key: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid', 'key'],
};

export const ise2eGetUsersOfRoomWithoutKeyParamsGET = ajv.compile<e2eGetUsersOfRoomWithoutKeyParamsGET>(
	e2eGetUsersOfRoomWithoutKeyParamsGETSchema,
);
