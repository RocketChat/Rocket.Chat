import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the roles endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const rolesExamples = {
	'roles.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						roles: [
							{
								_id: 'admin',
								description: 'Admin',
								mandatory2fa: false,
								protected: true,
								scope: 'Users',
							},
							{
								_id: 'moderator',
								description: 'Moderator',
								mandatory2fa: false,
								protected: true,
								scope: 'Subscriptions',
							},
							{
								_id: 'leader',
								description: 'Leader',
								mandatory2fa: false,
								protected: true,
								scope: 'Subscriptions',
							},
							{
								_id: 'owner',
								description: 'Owner',
								mandatory2fa: false,
								protected: true,
								scope: 'Subscriptions',
							},
							{
								_id: 'user',
								description: '',
								mandatory2fa: false,
								protected: true,
								scope: 'Users',
							},
							{
								_id: 'bot',
								description: '',
								mandatory2fa: false,
								protected: true,
								scope: 'Users',
							},
							{
								_id: 'guest',
								description: '',
								mandatory2fa: false,
								protected: true,
								scope: 'Users',
							},
							{
								_id: 'anonymous',
								description: '',
								mandatory2fa: false,
								protected: true,
								scope: 'Users',
							},
							{
								_id: 'livechat-agent',
								name: 'livechat-agent',
								scope: 'Users',
							},
							{
								_id: 'livechat-manager',
								name: 'livechat-manager',
								scope: 'Users',
							},
							{
								_id: 'livechat-guest',
								name: 'livechat-guest',
								scope: 'Users',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'roles.sync': {
		response: {
			'200': {
				'Success Example': {
					value: {
						roles: {
							update: [
								{
									_id: 'admin',
									description: 'Admin',
									mandatory2fa: false,
									protected: true,
									scope: 'Users',
								},
							],
							remove: [
								{
									_id: 'user',
									description: 'User',
									mandatory2fa: false,
									protected: true,
									scope: 'Users',
								},
							],
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "Match error: Missing key 'updatedSince'",
					},
				},
			},
		},
	},
	'roles.addUserToRole': {
		response: {
			'200': {
				'Success Example': {
					value: {
						role: {
							_id: 'auditor-log',
							scope: 'Users',
							description: '',
							mandatory2fa: false,
							name: 'auditor-log',
							protected: true,
							_updatedAt: '2023-07-10T23:20:56.702Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'username' [error-invalid-role-properties]",
						errorType: 'error-invalid-role-properties',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'The required "userId" or "username" param provided does not match any users [error-invalid-user]',
						errorType: 'error-invalid-user',
					},
				},
				'Example 3': {
					value: {
						success: false,
						error: 'error-invalid-role-properties',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					roleId: '6579adcf2dd9f9d9514f6',
					username: 'test.fun',
					roomId: '64adb09baa5ad4273bfc',
				},
			},
		},
	},
	'roles.getUsersInRole': {
		response: {
			'200': {
				'Success Example': {
					value: {
						users: [
							{
								_id: 'voakrL3cHjYBwwRPq',
								username: 'a',
								type: 'user',
								status: 'offline',
								active: true,
								name: 'a',
							},
							{
								_id: 'N2s7KG6YkzgJfXbyn',
								username: 'b',
								type: 'user',
								status: 'offline',
								active: true,
								name: 'b',
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Query param "role" is required [error-param-not-provided]',
						errorType: 'error-param-not-provided',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: '[error-invalid-roleId]',
						errorType: 'error-invalid-roleId',
					},
				},
			},
		},
	},
	'roles.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The role properties are invalid. [error-invalid-role-properties]',
						errorType: 'error-invalid-role-properties',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Accessing permissions is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
					},
				},
			},
		},
	},
	'roles.removeUserFromRole': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'The role properties are invalid. [error-invalid-role-properties]',
						errorType: 'error-invalid-role-properties',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Accessing permissions is not allowed [error-action-not-allowed]',
						errorType: 'error-action-not-allowed',
					},
				},
			},
		},
	},
	'roles.getUsersInPublicRoles': {
		response: {
			'200': {
				'Example 1': {
					value: {
						users: [
							{
								_id: 'kb2WBkjkut4YJpFQk',
								username: 'agent2',
								roles: ['livechat-agent'],
							},
							{
								_id: 'Ahgf5k9Ca4YEdMjwX',
								username: 'test.agent',
								roles: ['admin', 'livechat-agent'],
							},
						],
						success: true,
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
