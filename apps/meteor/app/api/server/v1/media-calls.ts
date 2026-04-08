import { MediaCall } from '@rocket.chat/core-services';
import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ServerMediaSignal } from '@rocket.chat/media-signaling';
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

type MediaCallsStateParams = {
	contractId: string;
};

const MediaCallsStateSchema: JSONSchemaType<MediaCallsStateParams> = {
	type: 'object',
	properties: {
		contractId: {
			type: 'string',
		},
	},
	required: ['contractId'],
	additionalProperties: false,
};

export const isMediaCallsStateProps = ajv.compile<MediaCallsStateParams>(MediaCallsStateSchema);

const mediaCallsStateEndpoints = API.v1.get(
	'media-calls.state',
	{
		response: {
			200: ajv.compile<{
				calls: IMediaCall[];
				signals: ServerMediaSignal[];
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
				required: ['calls', 'signals', 'success'],
			}),
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		query: isMediaCallsStateProps,
		authRequired: true,
	},
	async function action() {
		const { contractId } = this.queryParams;
		const { calls, signals } = await MediaCall.getUserState(this.userId, contractId);

		return API.v1.success({
			calls,
			signals,
		});
	},
);

type MediaCallsStateEndpoints = ExtractRoutesFromAPI<typeof mediaCallsStateEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends MediaCallsStateEndpoints {}
}
