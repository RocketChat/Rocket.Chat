import type { JSONSchemaType } from 'ajv';

/** Client is reporting a clean session, possibly brand new */
export type ClientMediaSignalRegister = {
	type: 'register';
	contractId: string;

	oldContractId?: string;
};

export const clientMediaSignalRegisterSchema: JSONSchemaType<ClientMediaSignalRegister> = {
	type: 'object',
	properties: {
		contractId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		type: {
			type: 'string',
			const: 'register',
		},
		oldContractId: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['contractId', 'type'],
};
