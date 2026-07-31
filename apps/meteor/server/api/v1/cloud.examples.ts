import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the cloud endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const cloudExamples = {
	'cloud.manualRegister': {
		response: {
			'400': {
				'Example': {
					value: {
						success: false,
						error: 'Workspace is already registered',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: "Match error: Missing key 'cloudBlob'",
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					cloudBlob: 'jfiscsm38urc3ujd',
				},
			},
		},
	},
	'cloud.registrationStatus': {
		response: {
			'200': {
				Example: {
					value: {
						registrationStatus: {
							workspaceRegistered: true,
							workspaceId: 'abc123-workspace-id',
							uniqueId: 'xyz789-unique-id',
							token: '',
							email: 'admin@example.com',
						},
						success: true,
					},
				},
			},
		},
	},
	'cloud.connectWorkspace': {
		response: {
			'400': {
				'Invalid Parameter': {
					value: {
						success: false,
						error: "must have required property 'token' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Failed to Connect': {
					value: {
						success: false,
						error: 'Failed to connect the workspace with Rocket.Chat Cloud',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					token: '5f03461b-9073-41e5-986d-e70f4d6ecbd1',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
