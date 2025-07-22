import type { JSONSchemaType } from 'ajv';

export type SDP = RTCSessionDescriptionInit;

export const sdpSchema: JSONSchemaType<RTCSessionDescriptionInit> = {
	type: 'object',
	properties: {
		sdp: {
			type: 'string',
			nullable: true,
		},
		type: {
			type: 'string',
			nullable: false,
		},
	},
	additionalProperties: false,
	nullable: false,
	required: ['type'],
};

export type IceCandidate = RTCIceCandidateInit;

export const iceCandidateSchema: JSONSchemaType<IceCandidate> = {
	type: 'object',
	properties: {
		candidate: {
			type: 'string',
			nullable: true,
		},
		sdpMLineIndex: {
			type: 'number',
			nullable: true,
		},
		sdpMid: {
			type: 'string',
			nullable: true,
		},
		usernameFragment: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	nullable: false,
	required: [],
};
