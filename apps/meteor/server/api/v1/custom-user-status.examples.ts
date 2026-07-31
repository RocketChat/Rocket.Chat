import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the custom-user-status endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const customUserStatusExamples = {
	'custom-user-status.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						statuses: [
							{
								_id: '63f61be0b000b6b6d86704c8',
								name: 'brb',
								statusType: 'away',
								_updatedAt: '2023-02-22T13:42:56.811Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
		},
	},
	'custom-user-status.create': {
		response: {
			'200': {
				'Success Example': {
					value: {
						customUserStatus: {
							_id: '65462e97a2f73c7460e18f84',
							name: 'caught up',
							statusType: 'busy',
							_updatedAt: '2023-11-04T11:44:23.366Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Missing Name Param': {
					value: {
						success: false,
						error: 'The field Name is required [error-the-field-is-required]',
						errorType: 'error-the-field-is-required',
						details: {
							method: 'insertOrUpdateUserStatus',
							field: 'Name',
						},
					},
				},
				'Status name already in use': {
					value: {
						success: false,
						error: 'The custom user status name is already in use [Custom_User_Status_Error_Name_Already_In_Use]',
						errorType: 'Custom_User_Status_Error_Name_Already_In_Use',
						details: {
							method: 'insertOrUpdateUserStatus',
						},
					},
				},
				'Invalid Status Type': {
					value: {
						success: false,
						error: 'Offline is not a valid status type [error-input-is-not-a-valid-field]',
						errorType: 'error-input-is-not-a-valid-field',
						details: {
							method: 'insertOrUpdateUserStatus',
							input: 'Offline',
							field: 'StatusType',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					name: 'caught up',
					statusType: 'busy',
				},
			},
		},
	},
	'custom-user-status.delete': {
		response: {
			'400': {
				'User status Id is required:': {
					value: {
						success: false,
						error: 'The "customUserStatusId" params is required!',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					customUserStatusId: '65462e97a2f73c7460e18f84',
				},
			},
		},
	},
	'custom-user-status.update': {
		response: {
			'200': {
				'Success Example': {
					value: {
						customUserStatus: {
							_id: '65462e97a2f73c7460e18f84',
							name: 'caught up again',
							statusType: 'busy',
							_updatedAt: '2023-11-04T11:51:28.353Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'User status not found': {
					value: {
						success: false,
						error: 'No custom user status found with the id of "SeZHHb77QXWRbnDh".',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					_id: '65462e97a2f73c7460e18f84',
					name: 'caught up again',
					statusType: 'busy',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
