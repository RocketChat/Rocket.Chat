import { ajv } from './../Ajv';
export type e2eGetUsersOfRoomWithoutKeyParamsGET = {
	rid: string;
};

const e2eGetUsersOfRoomWithoutKeyParamsGETSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

export const ise2eGetUsersOfRoomWithoutKeyParamsGET = ajv.compile<e2eGetUsersOfRoomWithoutKeyParamsGET>(
	e2eGetUsersOfRoomWithoutKeyParamsGETSchema,
);
