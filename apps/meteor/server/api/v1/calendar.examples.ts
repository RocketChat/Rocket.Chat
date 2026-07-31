import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the calendar endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const calendarExamples = {
	'calendar-events.list': {
		response: {
			'200': {
				'Example 1': {
					value: {
						data: [
							{
								_id: '690b02874e7e8bcf6985b27a',
								uid: 'C38WSSzrGd2NCjzqJ',
								startTime: '2025-03-26T07:17:00.000Z',
								endTime: '2025-03-26T07:18:00.000Z',
								subject: 'Subject8',
								description: 'Description8',
								meetingUrl: null,
								reminderMinutesBeforeStart: 10,
								reminderTime: '2025-03-26T07:07:00.000Z',
								notificationSent: false,
								_updatedAt: '2025-11-05T07:53:43.420Z',
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
						error: "must have required property 'date' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'calendar-events.info': {
		response: {
			'200': {
				'Example 1': {
					value: {
						event: {
							_id: '690b02874e7e8bcf6985b27a',
							uid: 'C38WSSzrGd2NCjzqJ',
							startTime: '2025-03-26T07:17:00.000Z',
							endTime: '2025-03-26T07:18:00.000Z',
							subject: 'Subject8',
							description: 'Description8',
							meetingUrl: null,
							reminderMinutesBeforeStart: 10,
							reminderTime: '2025-03-26T07:07:00.000Z',
							notificationSent: false,
							_updatedAt: '2025-11-05T07:53:43.420Z',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'id' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'calendar-events.create': {
		response: {
			'200': {
				'Example 1': {
					value: {
						id: '690b08674e7e8bcf6985b2d5',
						success: true,
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					startTime: '2025-11-05T07:17:00.000Z',
					endTime: '2025-11-05T07:18:00.000Z',
					subject: 'Subject8',
					description: 'Description8',
					reminderMinutesBeforeStart: 10,
				},
			},
		},
	},
	'calendar-events.import': {
		response: {
			'200': {
				'Example 1': {
					value: {
						id: '690c2b2d4e7e8bcf6985b3d8',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'externalId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					externalId: 'NWwwcnU3NmM1NW03dDRtZGdkMWNjNDRmamsgcmFjaGFuYS52aXNhdmFkaXlhQHJvY2tldC5jaGF0',
					startTime: '2025-11-05T07:17:00.000Z',
					endTime: '2025-11-05T07:18:00.000Z',
					subject: 'Subject8',
					description: 'Description8',
					reminderMinutesBeforeStart: 10,
					busy: true,
				},
			},
		},
	},
	'calendar-events.update': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'eventId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					eventId: '690b08674e7e8bcf6985b2d5',
					startTime: '2025-11-05T07:17:00.000Z',
					endTime: '2025-11-05T07:18:00.000Z',
					subject: 'Subject8',
					description: 'Description8',
					reminderMinutesBeforeStart: 10,
				},
			},
		},
	},
	'calendar-events.delete': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'invalid-calendar-event',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					eventId: '6909b8ea4e7e8bcf6985b1a8',
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
