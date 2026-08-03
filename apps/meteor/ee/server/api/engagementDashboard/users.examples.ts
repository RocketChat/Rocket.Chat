/**
 * Request and response examples for the users endpoints, imported from
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

export const usersExamples: Record<string, PayloadExamples> = {
	'engagement-dashboard/users/new-users': {
		response: {
			'200': {
				'Success Example': {
					value: {
						days: [
							{
								day: '2023-02-09T00:00:00.000Z',
								users: 1,
							},
							{
								day: '2023-02-06T00:00:00.000Z',
								users: 6,
							},
							{
								day: '2023-02-01T00:00:00.000Z',
								users: 1,
							},
							{
								day: '2023-01-24T00:00:00.000Z',
								users: 1,
							},
							{
								day: '2023-01-17T00:00:00.000Z',
								users: 1,
							},
						],
						period: {
							count: 27,
							variation: 27,
						},
						yesterday: {
							count: 0,
							variation: 0,
						},
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/users/active-users': {
		response: {
			'200': {
				'Success Example': {
					value: {
						month: [
							{
								usersList: ['rYhzFRd2QZjNwAAXX'],
								users: 1,
								day: 5,
								month: 5,
								year: 2023,
							},
							{
								usersList: ['rYhzFRd2QZjNwAAXX'],
								users: 1,
								day: 4,
								month: 5,
								year: 2023,
							},
							{
								usersList: ['rYhzFRd2QZjNwAAXX'],
								users: 1,
								day: 3,
								month: 5,
								year: 2023,
							},
							{
								usersList: ['rYhzFRd2QZjNwAAXX'],
								users: 1,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								usersList: ['rbAXPnMktTFbNpwtJ', '9iN96PXnDK7XAYESA'],
								users: 2,
								day: 17,
								month: 4,
								year: 2023,
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/users/chat-busier/hourly-data': {
		response: {
			'200': {
				'Success Example': {
					value: {
						hours: [
							{
								users: 3,
								hour: 22,
							},
							{
								users: 3,
								hour: 20,
							},
							{
								users: 4,
								hour: 18,
							},
							{
								users: 2,
								hour: 16,
							},
							{
								users: 4,
								hour: 14,
							},
							{
								users: 4,
								hour: 12,
							},
							{
								users: 2,
								hour: 10,
							},
							{
								users: 1,
								hour: 8,
							},
							{
								users: 1,
								hour: 6,
							},
							{
								users: 1,
								hour: 4,
							},
							{
								users: 0,
								hour: 2,
							},
							{
								users: 0,
								hour: 0,
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/users/chat-busier/weekly-data': {
		response: {
			'200': {
				'Success Example': {
					value: {
						days: [
							{
								day: '2023-02-01T00:00:00.000Z',
								users: 1,
							},
							{
								day: '2023-01-24T00:00:00.000Z',
								users: 1,
							},
							{
								day: '2023-01-17T00:00:00.000Z',
								users: 1,
							},
						],
						period: {
							count: 27,
							variation: 27,
						},
						yesterday: {
							count: 0,
							variation: 0,
						},
						success: true,
					},
				},
			},
		},
	},
	'engagement-dashboard/users/users-by-time-of-the-day-in-a-week': {
		response: {
			'200': {
				'Success Example': {
					value: {
						week: [
							{
								users: 1,
								hour: 23,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 22,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 21,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 20,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 19,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 18,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 17,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 16,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 15,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 14,
								day: 2,
								month: 5,
								year: 2023,
							},
							{
								users: 1,
								hour: 1,
								day: 1,
								month: 5,
								year: 2023,
							},
						],
						success: true,
					},
				},
			},
		},
	},
};
