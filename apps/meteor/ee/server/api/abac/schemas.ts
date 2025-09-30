import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

const ABACToggleRoomStatusSuccess = {
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	additionalProperties: false,
};

export const POSTAbacToggleRoomStatusSuccessSchema = ajv.compile<void>(ABACToggleRoomStatusSuccess);
