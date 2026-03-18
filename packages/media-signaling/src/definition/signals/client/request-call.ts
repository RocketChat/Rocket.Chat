import type { JSONSchemaType } from 'ajv';

import { callActorTypes } from '../../call';
import type { CallActorType, CallFeature, CallService } from '../../call';
import { callFeatureList } from '../../call/IClientMediaCall';

type Callee = {
	type: CallActorType;
	id: string;
};

export type ClientMediaSignalRequestCall = {
	/** the callId on this signal is temporary and is never propagated to other agents */
	callId: string;
	contractId: string;
	type: 'request-call';
	callees: Callee[];
	supportedServices: CallService[];
	supportedFeatures?: CallFeature[];
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
		callees: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					type: {
						type: 'string',
						enum: callActorTypes,
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
			nullable: false,
			minItems: 1,
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
	required: ['callId', 'contractId', 'type', 'supportedServices', 'callees'],
};
