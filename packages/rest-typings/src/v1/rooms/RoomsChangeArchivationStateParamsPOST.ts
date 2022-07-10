import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type RoomsChangeArchivationStateParamsPOST = {
	rid: string;
	action?: string;
};

const RoomsChangeArchivationStateParamsPOSTSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		action: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['rid'],
};

export const isRoomsChangeArchivationStateParamsPOST = ajv.compile<RoomsChangeArchivationStateParamsPOST>(
	RoomsChangeArchivationStateParamsPOSTSchema,
);
