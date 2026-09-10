import type { JSONSchemaType } from 'ajv';

import type { CallFeature, CallService } from '../../call';
import { callFeatureList, callServiceList } from '../../call/IClientMediaCall';

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
	supportedFeatures?: CallFeature[];
	/**
	 * Explicitly requested service for this call. When set, the server should honor it instead of
	 * picking a service from `supportedServices`. Used to place a call on a non-webrtc endpoint
	 * (e.g. a `cti` desk phone) that the browser itself can't service.
	 */
	requestedService?: CallService;
	/** Identifies which of the user's endpoints/devices should handle the call (opaque to Rocket.Chat, resolved by the app). */
	device?: string;
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
				enum: callServiceList,
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
		requestedService: {
			type: 'string',
			enum: callServiceList,
			nullable: true,
		},
		device: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['callId', 'contractId', 'type', 'callee', 'supportedServices'],
};
