/**
 * Request and response examples for the instances endpoints, imported from
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

export const instancesExamples: Record<string, PayloadExamples> = {
	'instances.get': {
		response: {
			'200': {
				'Get Instances': {
					value: {
						instances: [
							{
								address: 'localhost',
								currentStatus: {
									connected: true,
									lastHeartbeatTime: 16,
									local: true,
								},
								instanceRecord: {
									_id: '871f8be4-5fdb-45a8-868f-8d3e28a39148',
									_createdAt: '2024-05-22T11:14:11.845Z',
									_updatedAt: '2024-07-05T02:55:40.526Z',
									extraInformation: {
										host: 'localhost',
										port: '3000',
										tcpPort: 46443,
										os: {
											type: 'Linux',
											platform: 'linux',
											arch: 'x64',
											release: '5.10.165-143.735.amzn2.x86_64',
											uptime: 8455403.28,
											loadavg: [0.41, 0.17, 0.15],
											totalmem: 4110323712,
											freemem: 198479872,
											cpus: 2,
										},
										nodeVersion: 'v14.21.3',
										conns: 1,
									},
									name: 'rocket.chat',
									pid: 1,
								},
								broadcastAuth: true,
							},
						],
						success: true,
					},
				},
			},
		},
	},
};
