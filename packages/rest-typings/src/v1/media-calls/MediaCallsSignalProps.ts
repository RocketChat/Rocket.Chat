import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({ discriminator: true });

export type MediaCallsSignalProps = { signal: ClientMediaSignal };

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
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
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
				},
				{
					type: 'object',
					properties: {
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
						},
						type: {
							const: 'local-sdp',
						},
						sdp: sdpSchema,
					},
					additionalProperties: false,
					required: ['callId', 'contractId', 'type', 'sdp'],
				},
				{
					type: 'object',
					properties: {
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
						},
						type: {
							const: 'error',
						},
						errorCode: {
							type: 'string',
							nullable: false,
						},
					},
					additionalProperties: false,
					required: ['callId', 'contractId', 'type', 'errorCode'],
				},
				{
					type: 'object',
					properties: {
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
						},
						type: {
							const: 'answer',
						},
						answer: {
							type: 'string',
							nullable: false,
						},
					},
					additionalProperties: false,
					required: ['callId', 'contractId', 'type', 'answer'],
				},
				{
					type: 'object',
					properties: {
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
						},
						type: {
							const: 'hangup',
						},
						reason: {
							type: 'string',
							nullable: false,
						},
					},
					additionalProperties: false,
					required: ['callId', 'contractId', 'type', 'reason'],
				},
				{
					type: 'object',
					properties: {
						callId: {
							type: 'string',
							nullable: false,
						},
						contractId: {
							type: 'string',
							nullable: true,
						},
						type: {
							const: 'local-state',
						},
						callState: {
							type: 'string',
							nullable: false,
						},
						clientState: {
							type: 'string',
							nullable: false,
						},
						serviceStates: {
							type: 'object',
							patternProperties: {
								'.*': {
									type: 'string',
								},
							},
							nullable: true,
						},
					},
					additionalProperties: false,
					required: ['callId', 'contractId', 'type', 'callState', 'clientState'],
				},
			],
		},
	},
	required: ['signal'],
	additionalProperties: false,
};

export const isMediaCallsSignalProps = ajv.compile(mediaCallsSignalPropsSchema);
