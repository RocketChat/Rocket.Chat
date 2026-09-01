import { ajv, validateBadRequestErrorResponse } from '@rocket.chat/rest-typings';

import type { SetupWizardParameters } from '../../lib/getSetupWizardParameters';
import { getSetupWizardParameters } from '../../lib/getSetupWizardParameters';
import { API } from '../api';

const setupWizardParametersResponseSchema = ajv.compile<SetupWizardParameters>({
	type: 'object',
	properties: {
		settings: { type: 'array', items: { type: 'object' } },
		serverAlreadyRegistered: { type: 'boolean' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['settings', 'serverAlreadyRegistered', 'success'],
	additionalProperties: false,
});

// Unauthenticated on purpose: it feeds the setup wizard, which runs before the first admin exists.
API.v1.get(
	'setupWizard.parameters',
	{
		authRequired: false,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 20 },
		response: {
			200: setupWizardParametersResponseSchema,
			400: validateBadRequestErrorResponse,
		},
	},
	async function action() {
		return API.v1.success(await getSetupWizardParameters());
	},
);
