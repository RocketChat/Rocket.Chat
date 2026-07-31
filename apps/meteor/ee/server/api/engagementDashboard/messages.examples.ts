import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the messages endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const messagesExamples = {
	'engagement-dashboard/messages/messages-sent': {
		response: {
			'200': {
				'Success Example': {
					value: {
						days: [
							{
								day: '2023-05-22T00:00:00.000Z',
								messages: 22,
							},
							{
								day: '2023-05-21T00:00:00.000Z',
								messages: 5,
							},
						],
						period: {
							count: 760,
							variation: 716,
						},
						yesterday: {
							count: 101,
							variation: 82,
						},
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/messages/origin': {
		response: {
			'200': {
				'Success Example': {
					value: {
						origins: [
							{
								messages: 7302,
								t: 'c',
							},
							{
								messages: 1147,
								t: 'd',
							},
							{
								messages: 122,
								t: 'p',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/messages/top-five-popular-channels': {
		response: {
			'200': {
				'Success Example': {
					value: {
						channels: [
							{
								messages: 727,
								t: 'd',
								usernames: ['google-calendar.bot', 'pavi.kim'],
							},
							{
								messages: 26,
								t: 'd',
								usernames: ['fun.baek', 'google-calendar.bot'],
							},
							{
								messages: 2,
								t: 'd',
								usernames: ['test.test', 'rocket.cat'],
							},
							{
								messages: 1,
								t: 'd',
								usernames: ['ria.mit', 'rocket.cat'],
							},
							{
								messages: 1,
								t: 'd',
								usernames: ['janna.coelho', 'rocket.cat'],
							},
						],
						success: true,
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
