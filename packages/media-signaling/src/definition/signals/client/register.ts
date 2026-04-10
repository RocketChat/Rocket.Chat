import type { JSONSchemaType } from 'ajv';

/** Client is reporting a clean session, possibly brand new */
export type ClientMediaSignalRegister = {
	type: 'register';
	contractId: string;

	oldContractId?: string;
	// If true, signals for existing calls will be re-sent to the client
	requestSignals?: boolean;
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
		requestSignals: {
			type: 'boolean',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['contractId', 'type'],
};
