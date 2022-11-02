import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type UserDeactivateIdleParamsPOST = {
	daysIdle: number;
	role?: string;
};

const userDeactivateIdleSchema = {
	type: 'object',
	properties: {
		daysIdle: {
			type: 'number',
		},
		role: {
			type: 'string',
		},
	},
	required: ['daysIdle'],
	additionalProperties: false,
};

export const isUserDeactivateIdleParamsPOST = ajv.compile<UserDeactivateIdleParamsPOST>(userDeactivateIdleSchema);
