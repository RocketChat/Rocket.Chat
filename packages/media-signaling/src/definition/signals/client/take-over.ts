import type { JSONSchemaType } from 'ajv';

import type { CallFeature } from '../../call';
import { callFeatureList } from '../../call/IClientMediaCall';

/** Client is asking to continue, on this session, a call that is happening on another session of the same user */
export type ClientMediaSignalTakeOver = {
	callId: string;
	type: 'take-over';
	contractId: string;

	supportedFeatures?: CallFeature[];
};

export const clientMediaSignalTakeOverSchema: JSONSchemaType<ClientMediaSignalTakeOver> = {
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
			const: 'take-over',
		},
		supportedFeatures: {
			type: 'array',
			items: {
				type: 'string',
				enum: callFeatureList,
				nullable: false,
			},
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type'],
};
