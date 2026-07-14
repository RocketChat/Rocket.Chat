import { ajvQuery } from '@rocket.chat/rest-typings';

import type { ServiceConfiguration } from './ServiceConfiguration';

export type PolicyServerResponse = {
	status: 'success' | 'failure';
	action?: 'reject' | 'continue';
	result: ServiceConfiguration;
};

const policyServerResponseSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
			nullable: false,
		},
		action: {
			type: 'string',
			nullable: true,
		},
		result: {
			type: 'object',
			additionalProperties: true,
		},
	},
	required: ['status', 'result'],
	additionalProperties: false,
};

export const isPolicyServerResponse = ajvQuery.compile<PolicyServerResponse>(policyServerResponseSchema);
