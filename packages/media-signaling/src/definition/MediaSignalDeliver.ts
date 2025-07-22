import type { JSONSchemaType } from 'ajv';

import { mediaSignalHeaderParamsSchema, type MediaSignalHeader } from './MediaSignalHeader';
import { iceCandidateSchema, sdpSchema } from './WebRTC';

export type DeliverSdpBody = {
	deliver: 'sdp';
	sdp: RTCSessionDescriptionInit;
	endOfCandidates: boolean;
};

export const deliverSdpBodySchema: JSONSchemaType<DeliverSdpBody> = {
	type: 'object',
	properties: {
		deliver: {
			type: 'string',
			pattern: 'sdp',
		},
		sdp: sdpSchema,
		endOfCandidates: {
			type: 'boolean',
			nullable: false,
		},
	},
	required: ['deliver', 'sdp', 'endOfCandidates'],
	additionalProperties: false,
};

export type DeliverIceCandidatesBody = {
	deliver: 'ice-candidates';
	candidates: RTCIceCandidateInit[];
	endOfCandidates: boolean;
};

export const deliverIceCandidatesBodySchema: JSONSchemaType<DeliverIceCandidatesBody> = {
	type: 'object',
	properties: {
		deliver: {
			type: 'string',
			pattern: 'ice-candidates',
		},
		candidates: {
			type: 'array',
			items: iceCandidateSchema,
		},
		endOfCandidates: {
			type: 'boolean',
			nullable: false,
		},
	},
	required: ['deliver', 'candidates', 'endOfCandidates'],
	additionalProperties: false,
};

export type DeliverDTMFBody = {
	deliver: 'dtmf';
	tone: string;
	duration?: number;
};

export const deliverDTMFBodySchema: JSONSchemaType<DeliverDTMFBody> = {
	type: 'object',
	properties: {
		deliver: {
			type: 'string',
			pattern: 'dtmf',
		},
		tone: {
			type: 'string',
			nullable: false,
		},
		duration: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['deliver', 'tone'],
	additionalProperties: false,
};

export type DeliverBodyMap = {
	'sdp': DeliverSdpBody;
	'ice-candidates': DeliverIceCandidatesBody;
	'dtmf': DeliverDTMFBody;
};

export type DeliverType = keyof DeliverBodyMap;

export type DeliverBody<T extends DeliverType = DeliverType> = DeliverBodyMap[T];

export type MediaSignalDeliver<T extends DeliverType = DeliverType> = MediaSignalHeader & {
	type: 'deliver';
	body: DeliverBody<T>;
};

export type DeliverParams<T extends DeliverType = DeliverType> = Omit<DeliverBody<T>, 'deliver'>;

export const mediaSignalDeliverSchema: JSONSchemaType<MediaSignalDeliver> = {
	type: 'object',
	allOf: [
		mediaSignalHeaderParamsSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'deliver',
				},
				body: {
					type: 'object',
					oneOf: [deliverSdpBodySchema, deliverIceCandidatesBodySchema, deliverDTMFBodySchema],
					additionalProperties: false,
				},
			},
			required: ['type', 'body'],
			additionalProperties: false,
		},
	],
	required: [...mediaSignalHeaderParamsSchema.required, 'type', 'body'],
};
