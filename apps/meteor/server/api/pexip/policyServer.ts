import type { PolicyServerResponse } from '@rocket.chat/pexip';
import { isServiceConfigurationRequestProps, isPolicyServerResponse, Pexip } from '@rocket.chat/pexip';
import { validateNotFoundErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import { getPexipSettings } from '../../settings/pexip';
import { API } from '../api';
import type { SuccessResult } from '../definition';

API.pexip.get(
	'policy/v1/service/configuration',
	{
		response: {
			200: isPolicyServerResponse,
			401: validateUnauthorizedErrorResponse,
			404: validateNotFoundErrorResponse,
		},
		query: isServiceConfigurationRequestProps,
		authRequired: false,
		rateLimiterOptions: false,
	},
	async function action() {
		const {
			queryParams: serviceRequest,
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

		const result = await pexip.getServiceConfiguration(serviceRequest);
		if (!result) {
			return API.pexip.notFound();
		}

		const status = 'success' as const;
		const action = 'continue' as const;

		const response: PolicyServerResponse = {
			status,
			action,
			result,
		};

		// do not use API.pexip.success to prevent it from mutating the body
		return {
			statusCode: 200,
			body: response,
		} as SuccessResult<PolicyServerResponse>;
	},
);
