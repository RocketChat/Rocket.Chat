import type { TelemetryMap } from '@rocket.chat/core-services';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type ConvertedTelemetryMap<T extends keyof TelemetryMap = keyof TelemetryMap> = {
	eventName: T;
} & TelemetryMap[T];

const StatisticsSchema = {
	_id: { type: 'string' },
	wizard: {
		type: 'object',
		properties: {
			organizationType: { type: 'string' },
			industry: { type: 'string' },
			size: { type: 'string' },
			country: { type: 'string' },
			language: { type: 'string' },
			serverType: { type: 'string' },
			registerServer: { type: 'boolean' },
		},
		// additionalProperties: false,
	},
	uniqueId: { type: 'string' },
	deploymentFingerprintHash: { type: 'string' },
	deploymentFingerprintVerified: { type: 'boolean' },
	installedAt: { type: 'string' },
	version: { type: 'string' },
	tag: { type: 'string' },
	branch: { type: 'string' },
	totalUsers: { type: 'integer' },
	activeUsers: { type: 'integer' },
	activeGuests: { type: 'integer' },
	nonActiveUsers: { type: 'integer' },
	appUsers: { type: 'integer' },
	onlineUsers: { type: 'integer' },
	awayUsers: { type: 'integer' },
	busyUsers: { type: 'integer' },
	totalConnectedUsers: { type: 'integer' },
	offlineUsers: { type: 'integer' },
	userLanguages: {
		type: 'object',
		additionalProperties: { type: 'integer' },
	},
	totalRooms: { type: 'integer' },
	totalChannels: { type: 'integer' },
	totalPrivateGroups: { type: 'integer' },
	totalDirect: { type: 'integer' },
	totalLivechat: { type: 'integer' },
	totalDiscussions: { type: 'integer' },
	totalThreads: { type: 'integer' },
	teams: {
		type: 'object',
		properties: {
			totalTeams: { type: 'integer' },
			totalRoomsInsideTeams: { type: 'integer' },
			totalDefaultRoomsInsideTeams: { type: 'integer' },
		},
		required: ['totalTeams', 'totalDefaultRoomsInsideTeams', 'totalRoomsInsideTeams'],
		// additionalProperties: false,
	},
	totalLivechatVisitors: { type: 'integer' },
	totalLivechatAgents: { type: 'integer' },
	totalLivechatManagers: { type: 'integer' },
	totalCustomFields: { type: 'integer' },
	totalLivechatPublicCustomFields: { type: 'integer' },
	livechatAutomaticForwardingUnansweredChats: { type: 'boolean' },
	livechatEnabled: { type: 'boolean' },
	isDepartmentRemovalEnabled: { type: 'boolean' },
	totalChannelMessages: { type: 'integer' },
	totalPrivateGroupMessages: { type: 'integer' },
	totalDirectMessages: { type: 'integer' },
	totalDiscussionsMessages: { type: 'integer' },
	totalLivechatMessages: { type: 'integer' },
	totalLivechatRoomsWithPriority: { type: 'integer' },
	totalLivechatRoomsWithDepartment: { type: 'integer' },
	totalTriggers: { type: 'integer' },
	totalMessages: { type: 'integer' },
	federatedServers: { type: 'integer' },
	federatedUsers: { type: 'integer' },
	lastLogin: { type: 'string' },
	lastMessageSentAt: { anyOf: [{ type: 'object' }, { type: undefined }] }, // TODO: convert [`lastMessageSentAt`](https://github.com/ahmed-n-abdeltwab/Rocket.Chat/blob/feat/OpenAPI/apps/meteor/node_modules/%40rocket.chat/core-typings/dist/IStats.d.ts#L74) from JavaScript `Date` object to string
	lastSeenSubscription: { type: 'string' },
	os: {
		type: 'object',
		properties: {
			type: { type: 'string' },
			platform: { type: 'string' },
			arch: { type: 'string' },
			release: { type: 'string' },
			uptime: { type: 'number' },
			loadavg: {
				type: 'array',
				items: { type: 'number' },
			},
			totalmem: { type: 'integer' },
			freemem: { type: 'integer' },
			cpus: { type: 'array' },
		},
		required: ['type', 'platform', 'arch', 'release', 'uptime', 'loadavg', 'totalmem', 'freemem', 'cpus'],
		// additionalProperties: false,
	},
	process: {
		type: 'object',
		properties: {
			nodeVersion: { type: 'string' },
			pid: { type: 'integer' },
			uptime: { type: 'number' },
		},
		required: ['nodeVersion', 'pid', 'uptime'],
		// additionalProperties: false,
	},
	deploy: {
		type: 'object',
		properties: {
			method: { type: 'string' },
			platform: { type: 'string' },
		},
		required: ['method', 'platform'],
		// additionalProperties: false,
	},
	enterpriseReady: { type: 'boolean' },
	uploadsTotal: { type: 'integer' },
	uploadsTotalSize: { type: 'integer' },
	migration: {
		type: 'object',
		properties: {
			_id: { type: 'string' },
			locked: { type: 'boolean' },
			version: { type: 'integer' },
			buildAt: { type: 'string' },
			lockedAt: { type: 'object' }, // TODO: convert `lockedAt` from JavaScript `Date` object to string
		},
		required: ['locked', 'version'],
		// additionalProperties: false,
	},
	instanceCount: { type: 'integer' },
	oplogEnabled: { type: 'boolean' },
	msEnabled: { type: 'boolean' },
	mongoVersion: { type: 'string' },
	mongoStorageEngine: { type: 'string' },
	pushQueue: { type: 'integer' },
	omnichannelSources: {
		type: 'array',
		items: {
			type: 'object',
			additionalProperties: {
				anyOf: [{ type: 'string' }, { type: 'integer' }, { type: undefined }], // FIXME: when refresh = true some values are undefined
			},
		},
	},
	omnichannelContactsBySource: {
		type: 'object',
		properties: {
			contactsCount: { type: 'integer' },
			conversationsCount: { type: 'integer' },
			sources: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						source: { type: 'string' },
						contactsCount: { type: 'integer' },
						conversationsCount: { type: 'integer' },
					},
					required: ['source', 'contactsCount', 'conversationsCount'],
					// additionalProperties: false,
				},
			},
		},
		required: ['contactsCount', 'conversationsCount', 'sources'],
		// additionalProperties: false,
	},
	uniqueContactsOfLastMonth: {
		type: 'object',
		properties: {
			contactsCount: { type: 'integer' },
			conversationsCount: { type: 'integer' },
			sources: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						source: { type: 'string' },
						contactsCount: { type: 'integer' },
						conversationsCount: { type: 'integer' },
					},
					required: ['source', 'contactsCount', 'conversationsCount'],
					// additionalProperties: false,
				},
			},
		},
		required: ['contactsCount', 'conversationsCount', 'sources'],
		// additionalProperties: false,
	},
	uniqueContactsOfLastWeek: {
		type: 'object',
		properties: {
			contactsCount: { type: 'integer' },
			conversationsCount: { type: 'integer' },
			sources: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						source: { type: 'string' },
						contactsCount: { type: 'integer' },
						conversationsCount: { type: 'integer' },
					},
					required: ['source', 'contactsCount', 'conversationsCount'],
					// additionalProperties: false,
				},
			},
		},
		required: ['contactsCount', 'conversationsCount', 'sources'],
		// additionalProperties: false,
	},
	uniqueContactsOfYesterday: {
		type: 'object',
		properties: {
			contactsCount: { type: 'integer' },
			conversationsCount: { type: 'integer' },
			sources: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						source: { type: 'string' },
						contactsCount: { type: 'integer' },
						conversationsCount: { type: 'integer' },
					},
					required: ['source', 'contactsCount', 'conversationsCount'],
					// additionalProperties: false,
				},
			},
		},
		required: ['contactsCount', 'conversationsCount', 'sources'],
		// additionalProperties: false,
	},
	departments: { type: 'integer' },
	archivedDepartments: { type: 'integer' },
	routingAlgorithm: { type: 'string' },
	onHoldEnabled: { type: 'boolean' },
	emailInboxes: { type: 'integer' },
	BusinessHours: {
		type: 'object',
		items: {
			type: 'object',
			additionalProperties: {
				anyOf: [{ type: 'string' }, { type: 'integer' }],
			},
		},
	},
	lastChattedAgentPreferred: { type: 'boolean' },
	assignNewConversationsToContactManager: { type: 'boolean' },
	visitorAbandonment: { type: 'string' },
	chatsOnHold: { type: 'integer' },
	voipEnabled: { type: 'boolean' },
	voipCalls: { type: 'integer' },
	voipExtensions: { type: 'integer' },
	voipSuccessfulCalls: { type: 'integer' },
	voipErrorCalls: { type: 'integer' },
	voipOnHoldCalls: { type: 'integer' },
	federationOverviewData: {
		type: 'object',
		properties: {
			numberOfEvents: { type: 'integer' },
			numberOfFederatedUsers: { type: 'integer' },
			numberOfServers: { type: 'integer' },
		},
	},
	readReceiptsEnabled: { type: 'boolean' },
	readReceiptsDetailed: { type: 'boolean' },
	uniqueUsersOfLastWeek: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						count: { type: 'integer' },
						sessions: { type: 'integer' },
						roles: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									role: { type: 'string' },
									count: { type: 'integer' },
									sessions: { type: 'integer' },
									time: { type: 'integer' },
								},
								required: ['role', 'count', 'sessions', 'time'],
								// additionalProperties: false,
							},
						},
					},
					required: ['count', 'sessions', 'roles'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueUsersOfLastMonth: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						count: { type: 'integer' },
						sessions: { type: 'integer' },
						roles: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									role: { type: 'string' },
									count: { type: 'integer' },
									sessions: { type: 'integer' },
									time: { type: 'integer' },
								},
								required: ['role', 'count', 'sessions', 'time'],
								// additionalProperties: false,
							},
						},
					},
					required: ['count', 'sessions', 'roles'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueUsersOfYesterday: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						count: { type: 'integer' },
						sessions: { type: 'integer' },
						roles: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									role: { type: 'string' },
									count: { type: 'integer' },
									sessions: { type: 'integer' },
									time: { type: 'integer' },
								},
								required: ['role', 'count', 'sessions', 'time'],
								// additionalProperties: false,
							},
						},
					},
					required: ['count', 'sessions', 'roles'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueDevicesOfYesterday: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						type: { type: 'string' },
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['type', 'name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueDevicesOfLastWeek: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						type: { type: 'string' },
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['type', 'name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueDevicesOfLastMonth: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						type: { type: 'string' },
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['type', 'name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueOSOfYesterday: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueOSOfLastWeek: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	uniqueOSOfLastMonth: {
		type: 'object',
		properties: {
			year: { type: 'integer' },
			month: { type: 'integer' },
			day: { type: 'integer' },
			data: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						version: { type: 'string' },
						count: { type: 'integer' },
						time: { type: 'integer' },
					},
					required: ['name', 'version', 'count', 'time'],
					// additionalProperties: false,
				},
			},
		},
		required: ['year', 'month', 'day', 'data'],
		// additionalProperties: false,
	},
	apps: {
		type: 'object',
		properties: {
			engineVersion: { type: 'string' },
			totalInstalled: {
				anyOf: [{ type: 'integer' }, { const: false }],
			},
			totalActive: {
				anyOf: [{ type: 'integer' }, { const: false }],
			},
			totalFailed: {
				anyOf: [{ type: 'integer' }, { const: false }],
			},
		},
		required: ['engineVersion', 'totalInstalled', 'totalActive', 'totalFailed'],
		// additionalProperties: false,
	},
	services: { type: 'object' },
	importer: { type: 'object' },
	settings: {
		type: 'object',
		properties: {
			accounts: {
				type: 'object',
				properties: {
					account2fa: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			cannedResponses: {
				type: 'object',
				properties: {
					cannedResponsesEnabled: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			e2ee: {
				type: 'object',
				properties: {
					e2e: { type: 'boolean' },
					e2eDefaultDirectRoom: { type: 'boolean' },
					e2eDefaultPrivateRoom: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			email: {
				type: 'object',
				properties: {
					smtp: {
						type: 'object',
						properties: {
							smtpHost: { type: 'string' },
							smtpPort: { type: 'string' },
							fromEmail: { type: 'string' },
						},
						// additionalProperties: false,
					},
				},
				// additionalProperties: false,
			},
			fileUpload: {
				type: 'object',
				properties: {
					fileUploadEnable: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			general: {
				type: 'object',
				properties: {
					apps: {
						type: 'object',
						properties: {
							frameworkDevMode: { type: 'boolean' },
							frameworkEnable: { type: 'boolean' },
						},
						// additionalProperties: false,
					},
					nps: {
						type: 'object',
						properties: {
							surveyEnabled: { type: 'boolean' },
						},
						// additionalProperties: false,
					},
					update: {
						type: 'object',
						properties: {
							updateChecker: { type: 'boolean' },
						},
						// additionalProperties: false,
					},
				},
				// additionalProperties: false,
			},
			liveStreamAndBroadcasting: {
				type: 'object',
				properties: {
					liveStream: { type: 'boolean' },
					broadcasting: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			message: {
				type: 'object',
				properties: {
					allowEditing: { type: 'boolean' },
					allowDeleting: { type: 'boolean' },
					allowUnrecognizedSlashCommand: { type: 'boolean' },
					allowBadWordsFilter: { type: 'boolean' },
					readReceiptEnabled: { type: 'boolean' },
					readReceiptStoreUsers: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			otr: {
				type: 'object',
				properties: {
					otrEnable: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			push: {
				type: 'object',
				properties: {
					pushEnable: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			search: {
				type: 'object',
				properties: {
					defaultProvider: {
						type: 'object',
						properties: {
							globalSearchEnabled: { type: 'boolean' },
						},
						// additionalProperties: false,
					},
				},
				// additionalProperties: false,
			},
			threads: {
				type: 'object',
				properties: {
					threadsEnabled: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
			webRTC: {
				type: 'object',
				properties: {
					webRTCEnableChannel: { type: 'boolean' },
					webRTCEnablePrivate: { type: 'boolean' },
					webRTCEnableDirect: { type: 'boolean' },
				},
				// additionalProperties: false,
			},
		},
	},
	integrations: {
		type: 'object',
		properties: {
			totalIntegrations: { type: 'integer' },
			totalIncoming: { type: 'integer' },
			totalIncomingActive: { type: 'integer' },
			totalOutgoing: { type: 'integer' },
			totalOutgoingActive: { type: 'integer' },
			totalWithScriptEnabled: { type: 'integer' },
		},
		required: [
			'totalIntegrations',
			'totalIncoming',
			'totalIncomingActive',
			'totalOutgoing',
			'totalOutgoingActive',
			'totalWithScriptEnabled',
		],
		// additionalProperties: false,
	},
	enterprise: {
		type: 'object',
		properties: {
			modules: {
				type: 'array',
				items: { type: 'string' },
			},
			tags: {
				type: 'array',
				items: { type: 'string' },
			},
			seatRequests: { type: 'integer' },
			livechatTags: { type: 'integer' },
			cannedResponses: { type: 'integer' },
			priorities: { type: 'integer' },
			slas: { type: 'integer' },
			businessUnits: { type: 'integer' },
			omnichannelPdfTranscriptRequested: { type: 'integer' },
			omnichannelPdfTranscriptSucceeded: { type: 'integer' },
			omnichannelRoomsWithSlas: { type: 'integer' },
			omnichannelRoomsWithPriorities: { type: 'integer' },
			livechatMonitors: { type: 'integer' },
			voip: {
				type: 'object',
				properties: {
					total: {
						type: 'object',
						properties: {
							calls: { type: 'integer' },
							externalInboundCalls: { type: 'integer' },
							externalOutboundCalls: { type: 'integer' },
							internalCalls: { type: 'integer' },
							externalCalls: { type: 'integer' },
							successfulCalls: { type: 'integer' },
							failedCalls: { type: 'integer' },
							callsDuration: { type: 'integer' },
						},
						// additionalProperties: false,
					},
					lastMonth: {
						type: 'object',
						properties: {
							calls: { type: 'integer' },
							externalInboundCalls: { type: 'integer' },
							externalOutboundCalls: { type: 'integer' },
							internalCalls: { type: 'integer' },
							externalCalls: { type: 'integer' },
							successfulCalls: { type: 'integer' },
							failedCalls: { type: 'integer' },
							callsDuration: { type: 'integer' },
						},
						// additionalProperties: false,
					},
					lastWeek: {
						type: 'object',
						properties: {
							calls: { type: 'integer' },
							externalInboundCalls: { type: 'integer' },
							externalOutboundCalls: { type: 'integer' },
							internalCalls: { type: 'integer' },
							externalCalls: { type: 'integer' },
							successfulCalls: { type: 'integer' },
							failedCalls: { type: 'integer' },
							callsDuration: { type: 'integer' },
						},
						// additionalProperties: false,
					},
					lastDay: {
						type: 'object',
						properties: {
							calls: { type: 'integer' },
							externalInboundCalls: { type: 'integer' },
							externalOutboundCalls: { type: 'integer' },
							internalCalls: { type: 'integer' },
							externalCalls: { type: 'integer' },
							successfulCalls: { type: 'integer' },
							failedCalls: { type: 'integer' },
							callsDuration: { type: 'integer' },
						},
						// additionalProperties: false,
					},
				},
				// additionalProperties: false,
			},
		},
		required: ['modules', 'tags', 'seatRequests'],
		// additionalProperties: false,
	},
	createdAt: {
		anyOf: [{ type: 'object' }, { type: 'string' }],
	},
	totalOTR: { type: 'integer' },
	totalOTRRooms: { type: 'integer' },
	slashCommandsJitsi: { type: 'integer' },
	messageAuditApply: { type: 'integer' },
	messageAuditLoad: { type: 'integer' },
	dashboardCount: { type: 'integer' },
	joinJitsiButton: { type: 'integer' },
	totalBroadcastRooms: { type: 'integer' },
	totalTriggeredEmails: { type: 'integer' },
	totalRoomsWithStarred: { type: 'integer' },
	totalRoomsWithPinned: { type: 'integer' },
	totalUserEmail2fa: { type: 'integer' },
	totalUserTOTP: { type: 'integer' },
	totalStarred: { type: 'integer' },
	totalPinned: { type: 'integer' },
	totalLinkInvitation: { type: 'integer' },
	totalEmailInvitation: { type: 'integer' },
	totalE2ERooms: { type: 'integer' },
	logoChange: { type: 'boolean' },
	homeTitleChanged: { type: 'boolean' },
	homeBodyChanged: { type: 'boolean' },
	customCSSChanged: { type: 'boolean' },
	onLogoutCustomScriptChanged: { type: 'boolean' },
	loggedOutCustomScriptChanged: { type: 'boolean' },
	loggedInCustomScriptChanged: { type: 'boolean' },
	roomsInsideTeams: { type: 'integer' },
	showHomeButton: { type: 'boolean' },
	totalEncryptedMessages: { type: 'integer' },
	totalLinkInvitationUses: { type: 'integer' },
	totalManuallyAddedUsers: { type: 'integer' },
	videoConf: {
		type: 'object',
		properties: {
			videoConference: {
				type: 'object',
				properties: {
					started: { type: 'integer' },
					ended: { type: 'integer' },
				},
				required: ['started', 'ended'],
				// additionalProperties: false,
			},
			direct: {
				type: 'object',
				properties: {
					calling: { type: 'integer' },
					started: { type: 'integer' },
					ended: { type: 'integer' },
				},
				required: ['calling', 'started', 'ended'],
				// additionalProperties: false,
			},
			livechat: {
				type: 'object',
				properties: {
					started: { type: 'integer' },
					ended: { type: 'integer' },
				},
				required: ['started', 'ended'],
				// additionalProperties: false,
			},
			settings: {
				type: 'object',
				properties: {
					provider: { type: 'string' },
					dms: { type: 'boolean' },
					channels: { type: 'boolean' },
					groups: { type: 'boolean' },
					teams: { type: 'boolean' },
				},
				required: ['provider'], // FIXME: dms and channels, groups, teams should be on becouse its not optional in the parant interface [IStats]
				// additionalProperties: false,
			},
		},
		required: ['videoConference', 'direct', 'livechat', 'settings'],
		// additionalProperties: false,
	},
	totalSubscriptionRoles: { type: 'integer' },
	totalUserRoles: { type: 'integer' },
	totalCustomRoles: { type: 'integer' },
	totalWebRTCCalls: { type: 'integer' },
	uncaughtExceptionsCount: { type: 'integer' },
	push: { type: 'integer' },
	pushSecured: { type: 'boolean' },
	dailyPeakConnections: { type: 'integer' },
	maxMonthlyPeakConnections: { type: 'integer' },
	matrixFederation: {
		type: 'object',
		properties: {
			enabled: { type: 'boolean' },
			maximumSizeOfPublicRoomsUsers: { type: 'integer' },
			biggestRoom: {
				anyOf: [
					{
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
							usersCount: { type: 'integer' },
						},
						required: ['_id', 'name', 'usersCount'],
						// additionalProperties: false,
					},
					{ type: 'null' },
				],
			},
			smallestRoom: {
				anyOf: [
					{
						type: 'object',
						properties: {
							_id: { type: 'string' },
							name: { type: 'string' },
							usersCount: { type: 'integer' },
						},
						required: ['_id', 'name', 'usersCount'],
						// additionalProperties: false,
					},
					{ type: 'null' },
				],
			},
			amountOfExternalUsers: { type: 'integer' },
			amountOfFederatedRooms: { type: 'integer' },
			externalConnectedServers: {
				type: 'object',
				properties: {
					quantity: { type: 'integer' },
					servers: {
						type: 'array',
						// items: { type: 'string' },
					},
				},
				required: ['quantity', 'servers'],
				// additionalProperties: false,
			},
		},
	},
	webRTCEnabled: { type: 'boolean' },
	webRTCEnabledForOmnichannel: { type: 'boolean' },
	omnichannelWebRTCCalls: { type: 'integer' },
	statsToken: { type: 'string' },
	contactVerification: {
		type: 'object',
		properties: {
			totalContacts: { type: 'integer' },
			totalUnknownContacts: { type: 'integer' },
			totalMergedContacts: { type: 'integer' },
			totalConflicts: { type: 'integer' },
			totalResolvedConflicts: { type: 'integer' },
			totalBlockedContacts: { type: 'integer' },
			totalPartiallyBlockedContacts: { type: 'integer' },
			totalFullyBlockedContacts: { type: 'integer' },
			totalVerifiedContacts: { type: 'integer' },
			avgChannelsPerContact: { type: 'number' },
			totalContactsWithoutChannels: { type: 'integer' },
			totalImportedContacts: { type: 'integer' },
			totalUpsellViews: { type: 'integer' },
			totalUpsellClicks: { type: 'integer' },
		},
	},
};

const commonUnauthorizedErrorSchema = {
	type: 'object',
	properties: {
		status: {
			type: 'string',
		},
		message: {
			type: 'string',
		},
	},
	required: ['status', 'message'],
	additionalProperties: false,
};

const commonBadRequestErrorSchema = {
	type: 'object',
	properties: {
		error: {
			type: 'string',
		},
		success: {
			type: 'boolean',
			description: 'Indicates if the request was successful.',
		},
	},
	required: ['success', 'error'],
};

API.v1
	.get(
		'statistics',
		{
			authRequired: true,
			query: ajv.compile<{
				refresh: 'true' | 'false';
			}>({
				type: 'object',
				properties: {
					refresh: {
						type: 'string',
						enum: ['true', 'false'],
						default: 'false',
					},
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						...StatisticsSchema,
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: [
						'_id',
						'wizard',
						'uniqueId',
						'deploymentFingerprintHash',
						'deploymentFingerprintVerified',
						'totalUsers',
						'activeUsers',
						'activeGuests',
						'nonActiveUsers',
						'appUsers',
						'onlineUsers',
						'awayUsers',
						'busyUsers',
						'totalConnectedUsers',
						'offlineUsers',
						'userLanguages',
						'totalRooms',
						'totalChannels',
						'totalPrivateGroups',
						'totalDirect',
						'totalLivechat',
						'totalDiscussions',
						'totalThreads',
						'teams',
						'totalLivechatVisitors',
						'totalLivechatAgents',
						'totalLivechatManagers',
						'totalCustomFields',
						'totalLivechatPublicCustomFields',
						'livechatAutomaticForwardingUnansweredChats',
						'livechatEnabled',
						'isDepartmentRemovalEnabled',
						'totalChannelMessages',
						'totalPrivateGroupMessages',
						'totalDirectMessages',
						'totalDiscussionsMessages',
						'totalLivechatMessages',
						// 'totalLivechatRoomsWithPriority', FIXME: this should be on becouse its not optional in the parant interface [IStats](https://github.com/ahmed-n-abdeltwab/Rocket.Chat/blob/feat/OpenAPI/packages/core-typings/dist/IStats.d.ts#L67)
						'totalLivechatRoomsWithDepartment',
						'totalTriggers',
						'totalMessages',
						'federatedServers',
						'federatedUsers',
						'lastLogin',
						// 'lastMessageSentAt',
						'lastSeenSubscription',
						'os',
						'process',
						'deploy',
						'enterpriseReady',
						'uploadsTotal',
						'uploadsTotalSize',
						'migration',
						'instanceCount',
						'oplogEnabled',
						'msEnabled',
						'mongoVersion',
						'mongoStorageEngine',
						'pushQueue',
						'omnichannelSources',
						'omnichannelContactsBySource',
						'uniqueContactsOfLastMonth',
						'uniqueContactsOfLastWeek',
						'uniqueContactsOfYesterday',
						'departments',
						'archivedDepartments',
						'routingAlgorithm',
						// 'onHoldEnabled',
						'emailInboxes',
						'BusinessHours',
						// 'lastChattedAgentPreferred',
						// 'assignNewConversationsToContactManager',
						// 'visitorAbandonment',
						'chatsOnHold',
						'voipEnabled',
						'voipCalls',
						'voipExtensions',
						'voipSuccessfulCalls',
						'voipErrorCalls',
						'voipOnHoldCalls',
						// 'federationOverviewData', FIXME: this should be on becouse its not optional in the parant interface [IStats](https://github.com/ahmed-n-abdeltwab/Rocket.Chat/blob/feat/OpenAPI/packages/core-typings/dist/IStats.d.ts#L137)
						'readReceiptsEnabled',
						'readReceiptsDetailed',
						'uniqueUsersOfLastWeek',
						'uniqueUsersOfLastMonth',
						'uniqueUsersOfYesterday',
						'uniqueDevicesOfYesterday',
						'uniqueDevicesOfLastWeek',
						'uniqueDevicesOfLastMonth',
						'uniqueOSOfYesterday',
						'uniqueOSOfLastWeek',
						'uniqueOSOfLastMonth',
						'apps',
						'services',
						'importer',
						'settings',
						'integrations',
						'enterprise',
						'createdAt',
						'totalOTR',
						'totalOTRRooms',
						'slashCommandsJitsi',
						'messageAuditApply',
						'messageAuditLoad',
						'dashboardCount',
						'joinJitsiButton',
						'totalBroadcastRooms',
						'totalTriggeredEmails',
						'totalRoomsWithStarred',
						'totalRoomsWithPinned',
						'totalUserEmail2fa',
						'totalUserTOTP',
						'totalStarred',
						'totalPinned',
						'totalLinkInvitation',
						'totalEmailInvitation',
						'totalE2ERooms',
						'logoChange',
						'homeTitleChanged',
						'homeBodyChanged',
						'customCSSChanged',
						'onLogoutCustomScriptChanged',
						'loggedOutCustomScriptChanged',
						'loggedInCustomScriptChanged',
						// 'roomsInsideTeams', FIXME: this should be on becouse its not optional in the parant interface [IStats]
						'showHomeButton',
						'totalEncryptedMessages',
						'totalLinkInvitationUses',
						'totalManuallyAddedUsers',
						'videoConf',
						'totalSubscriptionRoles',
						'totalUserRoles',
						'totalCustomRoles',
						'totalWebRTCCalls',
						'uncaughtExceptionsCount',
						'push',
						'pushSecured',
						'dailyPeakConnections',
						'maxMonthlyPeakConnections',
						'matrixFederation',
						'webRTCEnabled',
						'webRTCEnabledForOmnichannel',
						'omnichannelWebRTCCalls',
						'contactVerification',
						'success',
					],
					// additionalProperties: false, FIXME: this must turn to true, becouse the response is dynamic
				}),
				400: ajv.compile(commonBadRequestErrorSchema),
				401: ajv.compile(commonUnauthorizedErrorSchema),
			},
		},
		async function () {
			const { refresh = 'false' } = this.queryParams;
			return API.v1.success(
				await getLastStatistics({
					userId: this.userId,
					refresh: refresh === 'true',
				}),
			);
		},
	)
	.get(
		'statistics.list',
		{
			authRequired: true,
			query: ajv.compile<{
				offset: number;
				count: number;
				sort: Record<string, unknown>;
				fields: Record<string, unknown>;
				query: Record<string, unknown>;
			}>({
				type: 'object',
				properties: {
					offset: { type: 'integer', minimum: 0, default: 0 },
					count: { type: 'integer', minimum: 1, default: 25 },
					sort: { type: 'object', additionalProperties: true },
					fields: { type: 'object', additionalProperties: true },
					query: { type: 'object', additionalProperties: true },
				},
				additionalProperties: false,
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						statistics: {
							type: 'array',
							items: {
								type: 'object',
								properties: StatisticsSchema,
								required: [
									'_id',
									'wizard',
									'uniqueId',
									'installedAt',
									'version',
									'totalUsers',
									'activeUsers',
									'activeGuests',
									'nonActiveUsers',
									'appUsers',
									'onlineUsers',
									'awayUsers',
									'busyUsers',
									'totalConnectedUsers',
									'offlineUsers',
									'totalRooms',
									'userLanguages',
									'totalChannels',
									'totalPrivateGroups',
									'totalDirect',
									'totalLivechat',
									'totalDiscussions',
									'totalThreads',
									'totalLivechatVisitors',
									'totalLivechatAgents',
									'voipEnabled',
									'omnichannelSources',
									'BusinessHours',
									'chatsOnHold',
									'departments',
									'emailInboxes',
									'voipCalls',
									'voipExtensions',
									'voipErrorCalls',
									'voipSuccessfulCalls',
									'totalChannelMessages',
									'voipOnHoldCalls',
									'totalPrivateGroupMessages',
									'totalDirectMessages',
									'totalLivechatMessages',
									'totalMessages',
									'federatedServers',
									'federatedUsers',
									'os',
									'process',
									'deploy',
									'readReceiptsEnabled',
									'readReceiptsDetailed',
									'enterpriseReady',
									'uploadsTotal',
									'uploadsTotalSize',
									'migration',
									'instanceCount',
									'msEnabled',
									'oplogEnabled',
									'mongoVersion',
									'mongoStorageEngine',
									'apps',
									'uniqueUsersOfYesterday',
									'uniqueDevicesOfLastWeek',
									'uniqueOSOfLastWeek',
									'uniqueDevicesOfLastMonth',
									'uniqueOSOfYesterday',
									'uniqueOSOfLastMonth',
									'uniqueDevicesOfYesterday',
									'uniqueUsersOfLastWeek',
									'uniqueUsersOfLastMonth',
									'services',
									'importer',
									'videoConf',
									'dashboardCount',
									'messageAuditApply',
									'messageAuditLoad',
									'settings',
									'integrations',
									'pushQueue',
									'enterprise',
									'totalOTRRooms',
									'totalOTR',
									'totalBroadcastRooms',
									'teams',
									// 'totalRoomsWithActiveLivestream', FIXME: this should be on becouse its not optional in the parant interface [IStats]
									'totalTriggeredEmails',
									'totalRoomsWithStarred',
									'totalRoomsWithPinned',
									'totalUserTOTP',
									'totalUserEmail2fa',
									'totalPinned',
									'totalStarred',
									'totalLinkInvitation',
									'totalLinkInvitationUses',
									'totalEmailInvitation',
									'totalE2ERooms',
									'logoChange',
									'showHomeButton',
									'totalEncryptedMessages',
									'totalManuallyAddedUsers',
									'totalSubscriptionRoles',
									'totalUserRoles',
									'totalWebRTCCalls',
									// 'matrixBridgeEnabled', FIXME: this should be on becouse its not optional in the parant interface [IStats]
									'uncaughtExceptionsCount',
									'homeTitleChanged',
									'homeBodyChanged',
									'customCSSChanged',
									'onLogoutCustomScriptChanged',
									'loggedOutCustomScriptChanged',
									'loggedInCustomScriptChanged',
									'createdAt',
									'_updatedAt',
								],
							},
						},
						count: { type: 'integer', minimum: 1, default: 25 },
						offset: { type: 'integer', minimum: 0, default: 0 },
						total: { type: 'integer', minimum: 1, default: 25 },
						success: { type: 'boolean' },
					},
					additionalProperties: false,
					required: ['statistics', 'count', 'offset', 'total', 'success'],
				}),
				400: ajv.compile({
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'error'],
				}),
				401: ajv.compile({
					type: 'object',
					properties: {
						status: {
							type: 'string',
						},
						message: {
							type: 'string',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'status', 'message'],
				}),
			},
		},
		async function () {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields, query } = await this.parseJsonQuery();

			const { statistics, ...pagination } = await getStatistics({
				userId: this.userId,
				query,
				pagination: {
					offset,
					count,
					sort,
					fields,
				},
			});
			return API.v1.success({
				statistics,
				...pagination,
				success: true,
			});
		},
	)
	.post(
		'statistics.telemetry',
		{
			authRequired: true,
			body: ajv.compile<{
				params: ConvertedTelemetryMap[];
			}>({
				oneOf: [
					{
						type: 'object',
						properties: {
							eventName: { const: 'otrStats' },
							rid: { type: 'string' },
						},
						required: ['eventName', 'rid'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							eventName: { const: 'slashCommandsStats' },
							command: { type: 'string' },
						},
						required: ['eventName', 'command'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							eventName: { const: 'updateCounter' },
							settingsId: { type: 'string' },
						},
						required: ['eventName', 'settingsId'],
						additionalProperties: false,
					},
				],
			}),
			response: {
				200: ajv.compile({
					type: 'object',
					properties: {
						success: { type: 'boolean' },
					},
					required: ['success'],
					additionalProperties: false,
				}),
				400: ajv.compile({
					type: 'object',
					properties: {
						error: {
							type: 'string',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'error'],
				}),
				401: ajv.compile({
					type: 'object',
					properties: {
						status: {
							type: 'string',
						},
						message: {
							type: 'string',
						},
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: ['success', 'status', 'message'],
				}),
			},
		},
		async function () {
			const events = this.bodyParams;
			if (events?.params) {
				events.params.forEach((event) => {
					const { eventName, ...params } = event;
					void telemetryEvent.call(eventName, params);
				});
			}
			return API.v1.success();
		},
	);
