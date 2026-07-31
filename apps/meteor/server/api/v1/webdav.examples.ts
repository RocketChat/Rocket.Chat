import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the webdav endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const webdavExamples = {
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
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
