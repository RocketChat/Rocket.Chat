/**
 * Request and response examples for the businessHours endpoints, imported from
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

export const businessHoursExamples: Record<string, PayloadExamples> = {
	'livechat/business-hours.save': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property 'name'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					name: 'api-BH',
					timezoneName: 'Asia/Bangkok',
					daysOpen: ['Monday', 'Wednesday'],
					departmentsToApplyBusinessHour: 'TEST-DEPT',
					active: true,
					type: 'custom',
					workHours: [
						{
							day: 'Monday',
							start: '08:00:00',
							finish: '16:00:00',
							open: true,
						},
						{
							day: 'Wednesday',
							start: '08:00:00',
							finish: '16:00:00',
							open: true,
						},
					],
					_id: '6953b3bc6ff48667974be88e',
				},
			},
		},
	},
	'livechat/business-hours.remove': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						errorType: 'invalid-params',
						error: "must have required property '_id'",
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					_id: '6953aca46ff48667974be88c',
					type: 'custom',
				},
			},
		},
	},
};
