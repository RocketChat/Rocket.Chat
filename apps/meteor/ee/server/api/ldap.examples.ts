import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the ldap endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const ldapExamples = {
	'ldap.syncNow': {
		response: {
			'200': {
				'Success Example': {
					value: {
						message: 'Sync_in_progress',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'TOTP Required [totp-required]',
						errorType: 'totp-required',
						details: {
							method: 'totp',
							codeGenerated: false,
							availableMethods: ['totp'],
						},
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'LDAP_disabled',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
