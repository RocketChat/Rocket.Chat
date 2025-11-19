import type { JSONSchemaType } from 'ajv';

import type { CallState } from '../../call';
import type { ClientContractState, ClientState } from '../../client';

/** Client is sending their local call state */
export type ClientMediaSignalLocalState = {
	callId: string;
	contractId: string;
	type: 'local-state';

	callState: CallState;
	clientState: ClientState;
	serviceStates?: Record<string, string>;
	ignored?: boolean;
	contractState: ClientContractState;
	negotiationId?: string;
};

export const clientMediaSignalLocalStateSchema: JSONSchemaType<ClientMediaSignalLocalState> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		contractId: {
			type: 'string',
			nullable: false,
			minLength: 1,
		},
		type: {
			type: 'string',
			const: 'local-state',
		},
		callState: {
			type: 'string',
			enum: ['none', 'ringing', 'accepted', 'active', 'renegotiating', 'hangup'],
			nullable: false,
		},
		clientState: {
			type: 'string',
			enum: ['none', 'pending', 'accepting', 'accepted', 'busy-elsewhere', 'active', 'renegotiating', 'hangup'],
			nullable: false,
		},
		serviceStates: {
			type: 'object',
			patternProperties: {
				'.*': {
					type: 'string',
				},
			},
			nullable: true,
			required: [],
		},
		ignored: {
			type: 'boolean',
			nullable: true,
		},
		contractState: {
			type: 'string',
			enum: ['proposed', 'signed', 'pre-signed', 'self-signed', 'ignored'],
			nullable: false,
		},
		negotiationId: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'callState', 'clientState', 'contractState'],
};
