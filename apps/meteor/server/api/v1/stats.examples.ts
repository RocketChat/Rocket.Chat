/**
 * Request and response examples for the stats endpoints, imported from
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

export const statsExamples: Record<string, PayloadExamples> = {
	'statistics': {
		response: {
			'200': {
				'Success Example': {
					value: {
						result: [
							{
								_id: 'jRca8kibJx8NkLJxt',
								createdAt: '2018-04-13T12:46:26.517Z',
								emails: [
									{
										address: 'user.test.1523623548558@rocket.chat',
										verified: false,
									},
								],
								name: 'EditedRealNameuser.test.1523623548558',
								username: 'editedusernameuser.test.1523623548558',
								avatarETag: '6YbLtc4v9b4conXon',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
			'400': {
				'Permission Error': {
					value: {
						success: false,
						error: 'error-not-allowed',
					},
				},
			},
		},
	},
	'statistics.list': {
		response: {
			'200': {
				'Success Example': {
					value: {
						statistics: [
							{
								_id: 'v3D4mvobwfznKozH8',
								uniqueId: 'wD4EP3M7FeFzJZgk9',
								installedAt: '2018-02-18T19:40:45.369Z',
								version: '0.61.0-develop',
								totalUsers: 88,
								activeUsers: 88,
								nonActiveUsers: 0,
								onlineUsers: 0,
								awayUsers: 1,
								offlineUsers: 87,
								totalRooms: 81,
								totalChannels: 41,
								totalPrivateGroups: 37,
								totalDirect: 3,
								totlalLivechat: 0,
								totalMessages: 2408,
								totalChannelMessages: 730,
								totalPrivateGroupMessages: 1869,
								totalDirectMessages: 25,
								totalLivechatMessages: 0,
								lastLogin: '2018-02-24T12:44:45.045Z',
								lastMessageSentAt: '2018-02-23T18:14:03.490Z',
								lastSeenSubscription: '2018-02-23T17:58:54.779Z',
								instanceCount: 1,
								createdAt: '2018-02-24T15:13:00.312Z',
								_updatedAt: '2018-02-24T15:13:00.312Z',
							},
						],
						count: 1,
						offset: 0,
						total: 1,
						success: true,
					},
				},
			},
			'400': {
				'Permission Error': {
					value: {
						success: false,
						error: 'error-not-allowed',
					},
				},
			},
		},
	},
};
