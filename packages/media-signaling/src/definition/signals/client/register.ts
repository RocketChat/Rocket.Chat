import type { JSONSchemaType } from 'ajv';

/** Client is reporting a brand new session */
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
