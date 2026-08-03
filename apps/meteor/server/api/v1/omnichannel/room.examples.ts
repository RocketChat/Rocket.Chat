/**
 * Request and response examples for the room endpoints, imported from
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

export const roomExamples: Record<string, PayloadExamples> = {
	'livechat/visitor/department.transfer': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'token'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					token: '2c9035b72dec31be7e9ccbb3cbd9952394ea41c1517b76c528d403c00a3fccf9',
					rid: 'dCBiZX3XPWyPsa6pt',
					department: '68304887113ac52640bc1ca6',
				},
			},
		},
	},
	'livechat/rooms.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'roomId'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					roomId: 'nXHYnNu38qKRRtZDi',
				},
			},
		},
	},
	'livechat/rooms.removeAllClosedRooms': {
		response: {
			'200': {
				'Example 1': {
					value: {
						removedRooms: 19,
						success: true,
					},
				},
			},
		},
	},
};
