import type { JSONSchemaType } from 'ajv';

import type { CallState } from '../../call';
import type { ClientState } from '../../client';

// Client is sending their local call state
export type ClientMediaSignalLocalState = {
	callId: string;
	contractId: string;
	type: 'local-state';

	callState: CallState;
	clientState: ClientState;
	serviceStates?: Record<string, string>;
};

export const clientMediaSignalLocalStateSchema: JSONSchemaType<ClientMediaSignalLocalState> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
			nullable: false,
		},
		contractId: {
			type: 'string',
			nullable: false,
		},
		type: {
			type: 'string',
			const: 'local-state',
		},
		callState: {
			type: 'string',
			nullable: false,
		},
		clientState: {
			type: 'string',
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
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'callState', 'clientState'],
};
