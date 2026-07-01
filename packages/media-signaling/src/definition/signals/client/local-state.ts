import type { JSONSchemaType } from 'ajv';

import { callStateList, type CallState } from '../../call';
import type { ClientContractState, ClientState } from '../../client';
import { clientContractStateList, clientStateList } from '../../client';

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
			enum: callStateList,
			nullable: false,
		},
		clientState: {
			type: 'string',
			enum: clientStateList,
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
			enum: clientContractStateList,
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
