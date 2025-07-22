import type { JSONSchemaType } from 'ajv';

import { mediaSignalHeaderParamsSchema, type MediaSignalHeader } from './MediaSignalHeader';
import { sdpSchema } from './WebRTC';

export type RequestOfferBody = {
	request: 'offer';
	iceRestart?: boolean;
};

export const requestOfferBodySchema: JSONSchemaType<RequestOfferBody> = {
	type: 'object',
	properties: {
		request: {
			type: 'string',
			pattern: 'offer',
		},
		iceRestart: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['request'],
	additionalProperties: false,
};

export type RequestAnswerBody = {
	request: 'answer';
	offer: RTCSessionDescriptionInit;
};

export const requestAnswerBodySchema: JSONSchemaType<RequestAnswerBody> = {
	type: 'object',
	properties: {
		request: {
			type: 'string',
			pattern: 'answer',
		},
		offer: sdpSchema,
	},
	required: ['request'],
	additionalProperties: false,
};

export type RequestSdpBody = {
	request: 'sdp';
};

export const requestSdpBodySchema: JSONSchemaType<RequestSdpBody> = {
	type: 'object',
	properties: {
		request: {
			type: 'string',
			pattern: 'sdp',
		},
	},
	required: ['request'],
	additionalProperties: false,
};

export type RequestBodyMap = {
	offer: RequestOfferBody;
	answer: RequestAnswerBody;
	sdp: RequestSdpBody;
};

export type RequestBody<T extends keyof RequestBodyMap = keyof RequestBodyMap> = RequestBodyMap[T];

export type MediaSignalRequest<T extends keyof RequestBodyMap = keyof RequestBodyMap> = MediaSignalHeader & {
	type: 'request';
	body: RequestBody<T>;
};

export type RequestParams<T extends keyof RequestBodyMap = keyof RequestBodyMap> = Omit<RequestBody<T>, 'request'>;

export const mediaSignalRequestSchema: JSONSchemaType<MediaSignalRequest> = {
	type: 'object',
	allOf: [
		mediaSignalHeaderParamsSchema,
		{
			type: 'object',
			properties: {
				type: {
					type: 'string',
					pattern: 'request',
				},
				body: {
					type: 'object',
					oneOf: [requestOfferBodySchema, requestAnswerBodySchema, requestSdpBodySchema],
					additionalProperties: false,
				},
			},
			required: ['type', 'body'],
			additionalProperties: false,
		},
	],
	required: [...mediaSignalHeaderParamsSchema.required, 'type', 'body'],
};
