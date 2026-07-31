import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the videoConference endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const videoConferenceExamples = {
	'video-conference.start': {
		response: {
			'200': {
				'Example 1': {
					value: {
						data: {
							type: 'videoconference',
							callId: '697887e3c8b0533020781a4a',
							rid: '674eca3e43725ce31dd9a2e8',
							providerName: 'googlemeet',
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					roomId: '674eca3e43725ce31dd9a2e8',
					title: 'Test Call',
					allowRinging: true,
				},
			},
		},
	},
	'video-conference.join': {
		response: {
			'200': {
				'Example 1': {
					value: {
						url: 'http://g.co/meet/RocketChat_697887e3c8b0533020781a4a',
						providerName: 'googlemeet',
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'callId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					callId: '697887e3c8b0533020781a4a',
					state: {
						mic: true,
						cam: true,
					},
				},
			},
		},
	},
	'video-conference.cancel': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'callId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Example 2': {
					value: {
						success: false,
						error: 'invalid-call',
					},
				},
			},
		},
	},
	'video-conference.info': {
		response: {
			'200': {
				'Example 1': {
					value: {
						_id: '697866d5c8b053302078137a',
						type: 'videoconference',
						users: [
							{
								_id: 'fRv4qm8ycWHXSA7af',
								username: 'jane.doe',
								name: 'jane',
								avatarETag: null,
								ts: '2026-01-27T07:18:46.491Z',
							},
						],
						messages: {
							started: 'RdiQLFktbFxtK2XTZ',
						},
						status: 1,
						anonymousUsers: 0,
						createdAt: '2026-01-27T07:18:45.956Z',
						providerName: 'googlemeet',
						ringing: true,
						title: 'testdiscussion',
						rid: '68c8071650223764573dd2dc',
						createdBy: {
							_id: 'fRv4qm8ycWHXSA7af',
							name: 'jane',
							username: 'jane.doe',
						},
						_updatedAt: '2026-01-27T07:18:46.491Z',
						url: 'http://g.co/meet/RocketChat_697866d5c8b053302078137a',
						capabilities: {
							mic: false,
							cam: false,
							title: false,
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'callId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'video-conference.list': {
		response: {
			'200': {
				'Example 1': {
					value: {
						data: [
							{
								_id: '69786d0ac8b05330207814bd',
								type: 'videoconference',
								users: [
									{
										_id: 'fRv4qm8ycWHXSA7af',
										username: 'jane.doe',
										name: 'jane',
										avatarETag: null,
										ts: '2026-01-27T07:45:14.977Z',
									},
								],
								messages: {
									started: '8AqsmsMXDePKfDbHv',
								},
								status: 1,
								anonymousUsers: 0,
								createdAt: '2026-01-27T07:45:14.533Z',
								providerName: 'googlemeet',
								ringing: true,
								title: 'ui-test',
								rid: '674eca3e43725ce31dd9a2e8',
								createdBy: {
									_id: 'fRv4qm8ycWHXSA7af',
									name: 'jane',
									username: 'jane.doe',
								},
								_updatedAt: '2026-01-27T07:45:14.977Z',
								url: 'http://g.co/meet/RocketChat_69786d0ac8b05330207814bd',
							},
							{
								_id: '6772586c8dd061cca4edc998',
								type: 'videoconference',
								users: [
									{
										_id: 'fRv4qm8ycWHXSA7af',
										username: 'jane.doe',
										name: 'jane',
										ts: '2024-12-30T08:23:11.130Z',
									},
								],
								messages: {
									started: 'sTDmP2WSH6Rwt89iw',
								},
								status: 2,
								anonymousUsers: 0,
								createdAt: '2024-12-30T08:23:08.655Z',
								providerName: 'jitsi',
								rid: '674eca3e43725ce31dd9a2e8',
								title: 'ui-test',
								createdBy: {
									_id: 'fRv4qm8ycWHXSA7af',
									name: 'jane',
									username: 'jane.doe',
								},
								_updatedAt: '2024-12-31T09:00:00.025Z',
								url: 'https://meet.jit.si/RocketChat6772586c8dd061cca4edc998',
								endedAt: '2024-12-31T09:00:00.025Z',
							},
						],
						offset: 0,
						count: 2,
						total: 2,
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'roomId' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
	},
	'video-conference.providers': {
		response: {
			'200': {
				'Example 1': {
					value: {
						data: [
							{
								key: 'pexip',
								label: 'Pexip',
							},
							{
								key: 'googlemeet',
								label: 'GoogleMeet',
							},
						],
						success: true,
					},
				},
			},
		},
	},
	'video-conference.capabilities': {
		response: {
			'200': {
				'Example 1': {
					value: {
						providerName: 'googlemeet',
						capabilities: {
							mic: false,
							cam: false,
							title: false,
						},
						success: true,
					},
				},
				'Example 2': {
					value: {
						providerName: 'jitsi',
						capabilities: {
							mic: true,
							cam: true,
							title: true,
						},
						success: true,
					},
				},
			},
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: 'no-active-video-conf-provider',
					},
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
