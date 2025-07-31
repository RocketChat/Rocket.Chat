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

const signalHeader = {
	callId: {
		type: 'string',
		nullable: false,
	},
	sessionId: {
		type: 'string',
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
						...signalHeader,
						type: {
							const: 'new',
						},
						body: {
							type: 'object',
							properties: {
								service: {
									type: 'string',
									nullable: false,
								},
								kind: {
									type: 'string',
									nullable: false,
								},
								role: {
									type: 'string',
									nullable: false,
								},
							},
							additionalProperties: true,
							required: ['service', 'kind', 'role'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'sdp',
						},
						body: {
							type: 'object',
							properties: {
								sdp: sdpSchema,
							},
							required: ['sdp'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'request-offer',
						},
						body: {
							type: 'object',
							properties: {
								iceRestart: {
									type: 'boolean',
									nullable: true,
								},
							},
							required: [],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'error',
						},
						body: {
							type: 'object',
							properties: {
								errorCode: {
									type: 'string',
									nullable: false,
								},
							},
							required: ['errorCode'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'answer',
						},
						body: {
							type: 'object',
							properties: {
								answer: {
									type: 'string',
									nullable: false,
								},
							},
							required: ['answer'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'hangup',
						},
						body: {
							type: 'object',
							properties: {
								reason: {
									type: 'string',
									nullable: false,
								},
							},
							required: ['reason'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
				{
					type: 'object',
					properties: {
						...signalHeader,
						type: {
							const: 'notification',
						},
						body: {
							type: 'object',
							properties: {
								notification: {
									type: 'string',
									nullable: false,
								},
							},
							required: ['notification'],
						},
					},
					additionalProperties: false,
					required: [...Object.keys(signalHeader), 'type', 'body'],
				},
			],
		},
	},
	required: ['signal'],
	additionalProperties: true,
};

export const isMediaCallsSignalProps = ajv.compile(mediaCallsSignalPropsSchema);
