import type { CallService } from '../../call';

export type ClientMediaSignalRequestCall = {
	// the callId on this signal is temporary and is never propagated to other agents
	callId: string;
	contractId: string;
	type: 'request-call';
	callee: {
		type: 'user' | 'sip';
		id: string;
	};
	supportedServices: CallService[];
};

export const clientMediaSignalRequestCallSchema = {
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
			const: 'request-call',
		},
		callee: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					nullable: false,
				},
				id: {
					type: 'string',
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
			},
			nullable: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'callee', 'supportedServices'],
} as const;
