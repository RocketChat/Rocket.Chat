import { type AgentMediaSignal } from '@rocket.chat/media-signaling';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv({ discriminator: true });

export type MediaCallsSignalProps = { signal: AgentMediaSignal };

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
							const: 'sdp',
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
			],
		},
	},
	required: ['signal'],
	additionalProperties: false,
};

export const isMediaCallsSignalProps = ajv.compile(mediaCallsSignalPropsSchema);
