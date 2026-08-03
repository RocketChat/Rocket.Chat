/**
 * Request and response examples for the ldap endpoints, imported from
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

export const ldapExamples: Record<string, PayloadExamples> = {
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
};
