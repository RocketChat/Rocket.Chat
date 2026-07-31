import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the permissions endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const permissionsExamples = {
	'permissions.listAll': {
		response: {
			'200': {
				'Success Example': {
					value: {
						update: [
							{
								_id: 'access-permissions',
								_updatedAt: '2018-11-28T11:55:49.106Z',
								roles: ['admin'],
							},
							{
								_id: 'add-oauth-service',
								_updatedAt: '2018-11-28T12:59:51.974Z',
								roles: ['admin', 'user'],
							},
						],
						remove: [],
						success: true,
					},
				},
			},
		},
	},
	'permissions.update': {
		response: {
			'200': {
				'Success Example': {
					value: {
						permissions: [
							{
								_id: 'access-permissions',
								roles: ['admin'],
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
						error: 'Invalid body params',
						errorType: 'error-invalid-body-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'Editing permissions is not allowed',
						errorType: 'error-edit-permissions-not-allowed',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					permissions: [
						{
							_id: 'access-permissions',
							roles: ['admin'],
						},
					],
				},
			},
		},
	},
	'permissions.addRole': {
		response: {
			'400': {
				'Invalid Parameters': {
					value: {
						success: false,
						error: "must have required property 'role'",
						errorType: 'invalid-params',
					},
				},
				'Permission does not exist': {
					value: {
						success: false,
						error: 'Permission does not exist [error-invalid-permission]',
						errorType: 'error-invalid-permission',
						details: {
							method: 'authorization:addPermissionToRole',
							action: 'Adding_permission',
						},
					},
				},
				'Invalid Role': {
					value: {
						success: false,
						error: 'Role does not exist [error-invalid-role]',
						errorType: 'error-invalid-role',
						details: {
							method: 'authorization:addPermissionToRole',
							action: 'Adding_permission',
						},
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					permissionId: 'create-team-channel',
					role: 'user',
				},
			},
		},
	},
	'permissions.removeRole': {
		response: {
			'400': {
				'Invalid Parameters': {
					value: {
						success: false,
						error: "must have required property 'role'",
						errorType: 'invalid-params',
					},
				},
				'Permission not found': {
					value: {
						success: false,
						error: 'Permission not found [error-permission-not-found]',
						errorType: 'error-permission-not-found',
						details: {
							method: 'authorization:removeRoleFromPermission',
						},
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					permissionId: 'create-team-channel',
					role: 'user',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
