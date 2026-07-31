import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the index endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const abacExamples = {
	'abac/rooms/:rid/attributes': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Room not found': {
					value: {
						success: false,
						error: 'error-room-not-found',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
	'abac/rooms/:rid/attributes/:key': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Room not found': {
					value: {
						success: false,
						error: 'error-room-not-found',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
	'abac/attributes': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'ABAC disabled': {
					value: {
						success: false,
						error: 'error-abac-not-enabled',
					},
				},
				'Invalid attribute values': {
					value: {
						success: false,
						error: 'error-invalid-attribute-values',
					},
				},
				'Invalid attribute key': {
					value: {
						success: false,
						error: 'error-invalid-attribute-key',
					},
				},
				'Duplicate attribute key': {
					value: {
						success: false,
						error: 'error-duplicate-attribute-key',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					key: 'my_department',
					values: ['eng', 'sales', 'hr', 'it'],
				},
			},
		},
	},
	'abac/users/sync': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'ABAC disabled': {
					value: {
						success: false,
						error: 'error-abac-not-enabled',
					},
				},
				'Invalid body (schema validation)': {
					value: {
						success: false,
						error: 'error-invalid-body-params',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					usernames: ['alice'],
					ids: ['userId1'],
					emails: ['bob@example.com'],
					ldapIds: ['ldapId123'],
				},
			},
		},
	},
	'abac/attributes/:_id': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
					},
				},
			},
			'400': {
				'Attribute not found': {
					value: {
						success: false,
						error: 'error-attribute-not-found',
					},
				},
				'Attribute in use': {
					value: {
						success: false,
						error: 'error-attribute-in-use',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
	'abac/attributes/:key/is-in-use': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						inUse: true,
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
	'abac/rooms': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						rooms: [
							{
								_id: 'ROOM_ID',
								name: 'private-room',
								t: 'p',
								abacAttributes: [
									{
										key: 'my_department',
										values: ['eng', 'sales'],
									},
								],
							},
						],
						offset: 0,
						count: 25,
						total: 1,
					},
				},
			},
			'400': {
				'Invalid query': {
					value: {
						success: false,
						error: 'error-invalid-query-parameters',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
	'abac/pdp/health': {
		response: {
			'200': {
				'PDP Healthy': {
					value: {
						available: true,
						message: 'ABAC_PDP_Health_OK',
						success: true,
					},
				},
			},
			'400': {
				'PDP Unavailable': {
					value: {
						available: false,
						message: 'ABAC_PDP_Health_Not_OK',
						success: false,
					},
				},
				'Connection Error': {
					value: {
						available: false,
						message: 'Failed to connect to external PDP service',
						success: false,
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'You do not have permission to manage ABAC',
					},
				},
			},
		},
	},
	'abac/audit': {
		response: {
			'200': {
				Success: {
					value: {
						success: true,
						events: [
							{
								_id: 'EVENT_ID',
								t: 'abac.object.attribute.changed',
								ts: '2026-01-30T12:34:56.789Z',
								actor: {
									_id: 'USER_ID',
									username: 'admin',
									name: 'Admin',
								},
								data: {},
							},
						],
						offset: 0,
						count: 25,
						total: 1,
					},
				},
			},
			'400': {
				'Invalid query': {
					value: {
						success: false,
						error: 'error-invalid-query-parameters',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						success: false,
						error: 'error-unauthorized',
					},
				},
			},
			'403': {
				'Missing required ABAC permissions': {
					value: {
						success: false,
						error: 'error-not-authorized',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
