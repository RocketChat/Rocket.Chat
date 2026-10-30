import { ajv, validateBadRequestErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import type { ExtractRoutesFromAPI } from '../../../server/api/ApiClass';
import { API } from '../../../server/api/api';
import { setMemberHistoryAccess } from '../lib/restrictedMessageHistory/setMemberHistoryAccess';

const setMemberHistoryAccessBodySchema = ajv.compile<{ roomId: string; userId: string; restricted: boolean }>({
	type: 'object',
	properties: {
		roomId: { type: 'string', minLength: 1 },
		userId: { type: 'string', minLength: 1 },
		restricted: { type: 'boolean' },
	},
	required: ['roomId', 'userId', 'restricted'],
	additionalProperties: false,
});

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const restrictedMessageHistoryEndpoints = API.v1.post(
	'rooms.setMemberHistoryAccess',
	{
		authRequired: true,
		body: setMemberHistoryAccessBodySchema,
		response: {
			200: successResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
		license: ['experimental-enterprise-features'],
	},
	async function action() {
		const { roomId, userId, restricted } = this.bodyParams;

		await setMemberHistoryAccess(this.user, { rid: roomId, userId, restricted });

		return API.v1.success();
	},
);

export type RestrictedMessageHistoryEndpoints = ExtractRoutesFromAPI<typeof restrictedMessageHistoryEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// oxlint-disable-next-line @typescript-eslint/no-empty-interface
	interface Endpoints extends RestrictedMessageHistoryEndpoints {}
}
