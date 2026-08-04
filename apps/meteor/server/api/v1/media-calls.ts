import { MediaCall } from '@rocket.chat/core-services';
import type { IMediaCall } from '@rocket.chat/core-typings';
import type { CallAnswer, CallFeature, ServerMediaCallSignal } from '@rocket.chat/media-signaling';
import { callFeatureList, callAnswerList } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';
import {
	ajv,
	validateNotFoundErrorResponse,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';
import type { JSONSchemaType } from 'ajv';

import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type MediaCallsAnswer = {
	callId: string;
	contractId: string;

	answer: CallAnswer;

	supportedFeatures?: CallFeature[];
};

const MediaCallsAnswerSchema: JSONSchemaType<MediaCallsAnswer> = {
	type: 'object',
	properties: {
		callId: {
			type: 'string',
		},
		contractId: {
			type: 'string',
		},
		answer: {
			type: 'string',
			enum: callAnswerList,
		},
		supportedFeatures: {
			type: 'array',
			items: {
				type: 'string',
				enum: callFeatureList,
			},
			nullable: true,
		},
	},
	required: ['callId', 'contractId', 'answer'],
	additionalProperties: false,
};

export const isMediaCallsAnswerProps = ajv.compile<MediaCallsAnswer>(MediaCallsAnswerSchema);

const mediaCallsAnswerEndpoints = API.v1.post(
	'media-calls.answer',
	{
		response: {
			200: ajv.compile<{
				call: IMediaCall;
			}>({
				additionalProperties: false,
				type: 'object',
				properties: {
					call: {
						type: 'object',
						$ref: '#/components/schemas/IMediaCall',
						description: 'The updated call information.',
					},
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['call', 'success'],
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		body: isMediaCallsAnswerProps,
		authRequired: true,
	},
	async function action() {
		const call = await MediaCall.answerCall(this.userId, this.bodyParams);

		return API.v1.success({
			call,
		});
	},
);

type MediaCallsAnswerEndpoints = ExtractRoutesFromAPI<typeof mediaCallsAnswerEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends MediaCallsAnswerEndpoints {}
}

type MediaCallsStateSignalsParams = {
	contractId: string;
};

const MediaCallsStateSignalsSchema: JSONSchemaType<MediaCallsStateSignalsParams> = {
	type: 'object',
	properties: {
		contractId: {
			type: 'string',
		},
	},
	required: ['contractId'],
	additionalProperties: false,
};

export const isMediaCallsStateSignalsProps = ajv.compile<MediaCallsStateSignalsParams>(MediaCallsStateSignalsSchema);

const mediaCallsStateEndpoints = API.v1
	.get(
		'media-calls.state',
		{
			response: {
				200: ajv.compile<{
					calls: IMediaCall[];
				}>({
					additionalProperties: false,
					type: 'object',
					properties: {
						calls: {
							type: 'array',
							items: {
								type: 'object',
								$ref: '#/components/schemas/IMediaCall',
							},
							description: 'The list of active calls.',
						},
						success: {
							type: 'boolean',
							description: 'Indicates the request was successful.',
						},
					},
					required: ['calls', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
			},
			authRequired: true,
		},
		async function action() {
			const calls = await MediaCalls.findAllNotOverByUid(this.userId).toArray();

			return API.v1.success({
				calls,
			});
		},
	)
	.get(
		'media-calls.stateSignals',
		{
			response: {
				200: ajv.compile<{
					signals: ServerMediaCallSignal[];
				}>({
					additionalProperties: false,
					type: 'object',
					properties: {
						signals: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									type: { type: 'string' },
									callId: { type: 'string' },
								},
								required: ['callId', 'type'],
								additionalProperties: true,
							},
							description: 'The list of signals that were already sent for the active calls.',
						},
						success: {
							type: 'boolean',
							description: 'Indicates the request was successful.',
						},
					},
					required: ['signals', 'success'],
				}),
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
			},
			query: isMediaCallsStateSignalsProps,
			authRequired: true,
		},
		async function action() {
			const { contractId } = this.queryParams;
			const signals = await MediaCall.getUserStateSignals(this.userId, contractId);

			return API.v1.success({
				signals,
			});
		},
	);

type MediaCallsStateEndpoints = ExtractRoutesFromAPI<typeof mediaCallsStateEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends MediaCallsStateEndpoints {}
}
