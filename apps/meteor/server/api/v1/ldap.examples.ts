import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the ldap endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const ldapExamples = {
	'ldap.testConnection': {
		response: {
			'200': {
				'Success Example': {
					value: {
						message: 'Connection_success',
						success: true,
					},
				},
			},
		},
	},
	'ldap.testSearch': {
		response: {
			'200': {
				'Success Example': {
					value: {
						message: 'LDAP_User_Found',
						success: true,
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					username: 'bob',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
