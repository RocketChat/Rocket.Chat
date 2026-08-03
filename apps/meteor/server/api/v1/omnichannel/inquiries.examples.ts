/**
 * Request and response examples for the inquiries endpoints, imported from
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

export const inquiriesExamples: Record<string, PayloadExamples> = {
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
};
