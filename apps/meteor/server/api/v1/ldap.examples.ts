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
};
