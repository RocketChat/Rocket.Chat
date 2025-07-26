import { type MediaSignal } from '@rocket.chat/media-signaling';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({ discriminator: true });

export type MediaCallsSignalProps = { signal: MediaSignal };

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

const mandatoryHeader = {
	callId: {
		type: 'string',
		nullable: false,
	},
	sessionId: {
		type: 'string',
		nullable: true,
	},
	version: {
		type: 'number',
		nullable: false,
	},
	sequence: {
		type: 'number',
		nullable: false,
	},
	role: {
		type: 'string',
		nullable: false,
	},
};
const optionalHeader = {
	expectACK: {
		type: 'boolean',
		nullable: true,
	},
};

const mediaCallsSignalPropsSchema: JSONSchemaType<MediaCallsSignalProps> = {
	type: 'object',
	properties: {
		signal: {
			type: 'object',
			additionalProperties: true,
			discriminator: { propertyName: 'type' },
			required: ['type'],
			oneOf: [
				{
					type: 'object',
					properties: {
						...mandatoryHeader,
						...optionalHeader,
						type: {
							const: 'request',
						},
						body: {
							type: 'object',
							discriminator: { propertyName: 'request' },
							oneOf: [
								{
									properties: {
										request: { const: 'offer' },
										iceRestart: {
											type: 'boolean',
											nullable: true,
										},
									},
								},
								{
									properties: {
										request: { const: 'answer' },
										offer: sdpSchema,
									},
								},
								{
									properties: {
										request: { const: 'sdp' },
									},
								},
							],

							additionalProperties: true,
							required: ['request'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(mandatoryHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...mandatoryHeader,
						...optionalHeader,
						type: {
							const: 'deliver',
						},
						body: {
							type: 'object',
							discriminator: { propertyName: 'deliver' },
							oneOf: [
								{
									properties: {
										deliver: { const: 'sdp' },
										sdp: sdpSchema,
										endOfCandidates: {
											type: 'boolean',
											nullable: false,
										},
									},
									required: ['deliver', 'sdp', 'endOfCandidates'],
								},
								{
									properties: {
										deliver: { const: 'ice-candidates' },
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
								},
								{
									properties: {
										deliver: { const: 'dtmf' },
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
								},
							],
							required: ['deliver'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(mandatoryHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...mandatoryHeader,
						...optionalHeader,
						type: {
							const: 'notify',
						},
						body: {
							type: 'object',
							discriminator: { propertyName: 'notify' },
							oneOf: [
								{
									properties: {
										notify: { const: 'ack' },
									},
								},
								{
									properties: {
										notify: { const: 'error' },
										errorCode: {
											type: 'string',
											nullable: false,
										},
										errorText: {
											type: 'string',
											nullable: true,
										},
									},
									required: ['notify', 'errorCode'],
								},
								{
									properties: {
										notify: { const: 'new' },
										service: {
											const: 'webrtc',
										},
										kind: {
											const: 'direct',
										},
									},
									required: ['notify', 'service', 'kind'],
								},
								{
									properties: {
										notify: { const: 'state' },
										callState: {
											type: 'string',
										},
										serviceState: {
											type: 'string',
										},
										mediaState: {
											type: 'string',
										},
									},
									required: ['notify', 'callState', 'serviceState', 'mediaState'],
								},
								{
									properties: {
										notify: { const: 'unavailable' },
									},
								},
								{
									properties: {
										notify: { const: 'accept' },
									},
								},
								{
									properties: {
										notify: { const: 'reject' },
									},
								},
								{
									properties: {
										notify: { const: 'hangup' },
										reasonCode: {
											type: 'string',
											nullable: false,
										},
										reasonText: {
											type: 'string',
											nullable: true,
										},
									},
									required: ['notify', 'reasonCode'],
								},
								{
									properties: {
										notify: { const: 'negotiation-needed' },
										reason: {
											type: 'string',
											nullable: true,
										},
									},
								},
							],
							required: ['notify'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(mandatoryHeader), 'type', 'body'],
				},
			],
		},
	},
	required: ['signal'],
	additionalProperties: true,
};

export const isMediaCallsSignalProps = ajv.compile(mediaCallsSignalPropsSchema);
