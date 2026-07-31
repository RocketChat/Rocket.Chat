import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the assets endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const assetsExamples = {
	'assets.setAsset': {
		response: {
			'400': {
				'No asset name': {
					value: {
						success: false,
						error: 'Invalid asset',
					},
				},
				'Example 1': {
					value: {
						success: false,
						error: '[No file uploaded]',
						errorType: 'No file uploaded',
					},
				},
			},
		},
	},
	'assets.unsetAsset': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'assetName' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					assetName: 'logo',
					refreshAllClients: true,
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
