/**
 * Request and response examples for the webdav endpoints, imported from
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

export const webdavExamples: Record<string, PayloadExamples> = {
	'webdav.getMyAccounts': {
		response: {
			'200': {
				'Success Example': {
					value: {
						accounts: [
							{
								_id: 'P3Gru7ocFCd4vpKEs',
								server_url: 'http://localhost:8080/remote.php/webdav/',
								username: 'admin',
								name: 'Webdav account',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'webdav.removeWebdavAccount': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'accountId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					accountId: 'P3Gru7ocFCd4vpKEs',
				},
			},
		},
	},
};
