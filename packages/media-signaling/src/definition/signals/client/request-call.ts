import type { JSONSchemaType } from 'ajv';

import type { CallService } from '../../call';

export type ClientMediaSignalRequestCall = {
	/** the callId on this signal is temporary and is never propagated to other agents */
	callId: string;
	contractId: string;
	type: 'request-call';
	callee: {
		type: 'user' | 'sip';
		id: string;
	};
	supportedServices: CallService[];
};

export const clientMediaSignalRequestCallSchema: JSONSchemaType<ClientMediaSignalRequestCall> = {
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
			const: 'request-call',
		},
		callee: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: ['user', 'sip'],
					nullable: false,
				},
				id: {
					type: 'string',
					minLength: 1,
					nullable: false,
				},
			},
			required: ['type', 'id'],
			additionalProperties: false,
		},
		supportedServices: {
			type: 'array',
			items: {
				type: 'string',
				enum: ['webrtc'],
				nullable: false,
			},
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'callee', 'supportedServices'],
};
