import type { JSONSchemaType } from 'ajv';

import { callActorTypes } from '../../call';
import type { CallActorType } from '../../call';

/** Client is transfering the other actor to a new actor */
export type ClientMediaSignalTransfer = {
	callId: string;
	type: 'transfer';
	contractId: string;

	to: {
		type: CallActorType;
		id: string;
	};
};

export const clientMediaSignalTransferSchema: JSONSchemaType<ClientMediaSignalTransfer> = {
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
			const: 'transfer',
		},
		to: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: callActorTypes,
					nullable: false,
				},
				id: {
					type: 'string',
					nullable: false,
					minLength: 1,
				},
			},
			required: ['type', 'id'],
			additionalProperties: false,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'to'],
};
