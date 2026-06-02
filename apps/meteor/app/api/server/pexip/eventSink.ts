import { isEventSinkRequestProps, Pexip } from '@rocket.chat/pexip';
import { ajv, validateNotFoundErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getPexipSettings } from '../../../../server/settings/pexip';
import { API } from '../api';

const successResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

API.pexip.post(
	'events',
	{
		response: {
			200: successResponseSchema,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		body: isEventSinkRequestProps,
		authRequired: false,
		rateLimiterOptions: false,
	},
	async function action() {
		const {
			bodyParams: event,
			request: { headers },
		} = this;

		const settings = getPexipSettings();
		const pexip = new Pexip(settings);

		try {
			const authHeader = headers.get('authorization');

			pexip.validateRequestCredentials(authHeader);
		} catch (err) {
			return API.pexip.unauthorized();
		}

		void pexip.processEvent(event).catch(() => true);

		return API.pexip.success();
	},
);
