import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the inquiries endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const inquiriesExamples = {
	'livechat/inquiries.returnAsInquiry': {
		response: {
			'200': {
				'Example 1': {
					value: {
						result: true,
						success: true,
					},
				},
				'Inquiry already exists': {
					value: {
						result: false,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'room-closed',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					roomId: 'iFzJuwGtkg4KB4keW',
					departmentId: '66fa9ec66ea9eba859b650b3',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
