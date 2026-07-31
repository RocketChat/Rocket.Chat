import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the uploads endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const uploadsExamples = {
	'uploads.delete': {
		response: {
			'200': {
				'Example 1': {
					value: {
						deletedFiles: ['699e6b8a8eddae7c5eaed9c3', '699e6b8b8eddae7c5eaed9c5'],
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'fileId'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					fileId: '699e6b8a8eddae7c5eaed9c3',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
