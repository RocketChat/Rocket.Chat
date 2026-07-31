import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the tags endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const tagsExamples = {
	'livechat/tags.save': {
		response: {
			'200': {
				'New tag created': {
					value: {
						name: 'apiTag01',
						description: 'testing api endpoint',
						numDepartments: 1,
						departments: ['TEST-DEPT'],
						_id: '69536ca06ff48667974be86d',
						success: true,
					},
				},
				'Updated existing tag': {
					value: {
						name: 'apiTag-updated',
						description: 'testing api endpoint',
						numDepartments: 1,
						departments: ['TEST-DEPT'],
						_updatedAt: '2025-12-30T06:06:00.995Z',
						_id: '69536b7a6ff48667974be86b',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'tagData'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					tagData: {
						name: 'apiTag',
						description: 'testing',
					},
					tagDepartments: ['TEST-DEPT'],
					_id: '69536b7a6ff48667974be86b',
				},
			},
		},
	},
	'livechat/tags.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'Tag not found',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					id: '682223ba30c9c71254e46012',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
