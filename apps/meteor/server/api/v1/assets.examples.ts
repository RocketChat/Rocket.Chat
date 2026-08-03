/**
 * Request and response examples for the assets endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
/**
 * Local on purpose: importing the framework type here would put the examples in the type graph of
 * every endpoint that uses them, and this module only needs to describe their shape.
 */
type PayloadExamples = {
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	body?: unknown;
	response?: Record<number, unknown>;
};

export const assetsExamples: Record<string, PayloadExamples> = {
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
};
