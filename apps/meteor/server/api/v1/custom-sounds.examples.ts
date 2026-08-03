/**
 * Request and response examples for the custom-sounds endpoints, imported from
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

export const customSoundsExamples: Record<string, PayloadExamples> = {
	'custom-sounds.list': {
		response: {
			'200': {
				Success: {
					value: {
						sounds: [
							{
								_id: '65462caea2f73c7460e18f83',
								name: 'doremi',
								extension: 'mp3',
								_updatedAt: '2023-11-04T11:36:14.171Z',
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
	'custom-sounds.getOne': {
		response: {
			'200': {
				'Request succeeded; returns the sound metadata.': {
					value: {
						success: true,
						sound: {
							_id: '65462caea2f73c7460e18f83',
							name: 'doremi',
							extension: 'mp3',
							_updatedAt: '2023-11-04T11:36:14.171Z',
						},
					},
				},
			},
			'400': {
				'Invalid or missing _id': {
					value: {
						success: false,
						error: '[The required "_id" query param is missing.]',
						errorType: 'The required "_id" query param is missing.',
					},
				},
			},
			'401': {
				'Unauthorized login attempt': {
					value: {
						status: 'error',
						message: 'You must be logged in to do this.',
					},
				},
			},
			'403': {
				'No permission': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
					},
				},
			},
			'404': {
				'Sound not found': {
					value: {
						success: false,
						error: 'Custom Sound not found.',
					},
				},
			},
		},
	},
	'custom-sounds.create': {
		response: {
			'200': {
				'Success Example': {
					value: {
						sound: {
							_id: '65462caea2f73c7460e18f83',
						},
						success: true,
					},
				},
			},
			'400': {
				'MIME type not allowed': {
					value: {
						success: false,
						error: 'MIME type not allowed',
					},
				},
				'File too large': {
					value: {
						success: false,
						error: '[error-file-too-large]',
					},
				},
				'Name already in use': {
					value: {
						success: false,
						error: 'The custom sound name is already in use [Custom_Sound_Error_Name_Already_In_Use]',
					},
				},
				'Invalid name': {
					value: {
						success: false,
						error: '<script> is not a valid name',
					},
				},
				'Missing required field': {
					value: {
						success: false,
						error: "must have required property 'name' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
						errorType: 'error-unauthorized',
					},
				},
			},
		},
	},
	'custom-sounds.update': {
		response: {
			'400': {
				'Sound not found': {
					value: {
						success: false,
						error: 'Custom Sound not found.',
					},
				},
				'MIME type not allowed': {
					value: {
						success: false,
						error: 'MIME type not allowed',
					},
				},
				'File too large': {
					value: {
						success: false,
						error: '[error-file-too-large]',
					},
				},
				'Name already in use': {
					value: {
						success: false,
						error: 'The custom sound name is already in use [Custom_Sound_Error_Name_Already_In_Use]',
					},
				},
				'Invalid name': {
					value: {
						success: false,
						error: '<script> is not a valid name',
					},
				},
				'Missing required field': {
					value: {
						success: false,
						error: "must have required property '_id' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
						errorType: 'error-unauthorized',
					},
				},
			},
		},
	},
	'custom-sounds.delete': {
		response: {
			'400': {
				'Invalid sound': {
					value: {
						success: false,
						error: 'Custom_Sound_Error_Invalid_Sound',
					},
				},
				'Missing required field': {
					value: {
						success: false,
						error: "must have required property '_id' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
			'403': {
				'Permission Error': {
					value: {
						success: false,
						error: 'User does not have the permissions required for this action [error-unauthorized]',
						errorType: 'error-unauthorized',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					_id: '65462caea2f73c7460e18f83',
				},
			},
		},
	},
};
