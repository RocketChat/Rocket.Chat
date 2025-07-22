import type { JSONSchemaType } from 'ajv';

export type MediaSignalHeaderParams = {
	callId: string;
	sessionId: string;
	version: number;
	sequence: number;

	role: 'caller' | 'callee';

	expectACK?: boolean;
};

export const mediaSignalHeaderParamsSchema: JSONSchemaType<MediaSignalHeaderParams> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		sessionId: {
			type: 'string',
			nullable: false,
		},
		version: {
			type: 'number',
			nullable: false,
		},
		sequence: {
			type: 'number',
			nullable: false,
		},
		role: {
			type: 'string',
			nullable: false,
		},
		expectACK: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['callId', 'sessionId', 'version', 'sequence', 'role'],
	additionalProperties: true,
};

export type MediaSignalHeader = MediaSignalHeaderParams & {
	type: 'request' | 'deliver' | 'notify';
	body: Record<string, unknown>;
};

export const mediaSignalHeaderSchema: JSONSchemaType<MediaSignalHeader> = {
	type: 'object',
	allOf: [
		mediaSignalHeaderParamsSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					oneOf: ['request', 'deliver', 'notify'],
				},
				body: {
					type: 'object',
					additionalProperties: true,
				},
			},
			required: ['type', 'body'],
			additionalProperties: false,
		},
	],
	required: [...mediaSignalHeaderParamsSchema.required, 'type', 'body'],
};
