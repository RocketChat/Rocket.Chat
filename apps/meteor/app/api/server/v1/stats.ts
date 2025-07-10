import type { IStats } from '@rocket.chat/core-typings';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type StatisticsProps = { refresh?: 'true' | 'false' };

const StatisticsSchema = {
	type: 'object',
	properties: {
		refresh: {
			enum: ['true', 'false'],
			default: 'false',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isStatisticsProps = ajv.compile<StatisticsProps>(StatisticsSchema);

const statisticsEndpoints = API.v1.get(
	'statistics',
	{
		authRequired: true,
		query: isStatisticsProps,
		response: {
			200: ajv.compile<IStats>({
				type: 'object',
				properties: {
					_id: { type: 'string' },
					// Setup Wizard
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
						additionalProperties: false,
					},
					// Version
					uniqueId: { type: 'string' },
					installedAt: { type: 'string' },
					deploymentFingerprintHash: { type: 'string' },
					deploymentFingerprintVerified: { type: 'boolean' },
					version: { type: 'string' },
					tag: { type: 'string' },
					branch: { type: 'string' },
					// User statistics
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
					// Room statistics
					totalRooms: { type: 'integer' },
					totalChannels: { type: 'integer' },
					totalPrivateGroups: { type: 'integer' },
					totalDirect: { type: 'integer' },
					totalLivechat: { type: 'integer' },
					totalDiscussions: { type: 'integer' },
					totalThreads: { type: 'integer' },
					// livechat visitors
					totalLivechatVisitors: { type: 'integer' },
					// livechat agents
					totalLivechatAgents: { type: 'integer' },
					totalLivechatManagers: { type: 'integer' },
					// livechat enabled
					livechatEnabled: { type: 'boolean' },
					// Count and types of omnichannel rooms
					omnichannelSources: {
						type: 'array',
						items: [
							{
								type: 'object',
								properties: {
									id: { type: 'string' },
									type: { type: 'string' },
									count: { type: 'number' },
									alias: { type: 'string' },
								},
								additionalProperties: false,
							},
						],
						minItems: 0,
					},
					// Number of livechat rooms with department
					totalLivechatRoomsWithDepartment: { type: 'integer' },
					// Number of departments
					departments: { type: 'integer' },
					// Number of archived departments
					archivedDepartments: { type: 'integer' },
					// Workspace allows dpeartment removal
					isDepartmentRemovalEnabled: { type: 'boolean' },
					// Number of triggers
					totalTriggers: { type: 'integer' },
					// Number of custom fields
					totalCustomFields: { type: 'integer' },
					// Number of public custom fields
					totalLivechatPublicCustomFields: { type: 'integer' },
					// Livechat Automatic forwarding feature enabled
					livechatAutomaticForwardingUnansweredChats: { type: 'boolean' },
					// Type of routing algorithm used on omnichannel
					routingAlgorithm: { type: 'string' },
					// is on-hold active
					onHoldEnabled: { type: 'boolean' },
					// Number of Email Inboxes
					emailInboxes: { type: 'integer' },
					BusinessHours: {
						type: 'object',
						properties: {
							// Number of Business Hours
							total: { type: 'number' },
							// Business Hours strategy
							strategy: { type: 'string' },
						},
						required: ['total', 'strategy'],
						additionalProperties: false,
					},
					// Last-Chatted Agent Preferred (enabled/disabled)
					lastChattedAgentPreferred: { type: 'boolean' },
					// Assign new conversations to the contact manager (enabled/disabled)
					assignNewConversationsToContactManager: { type: 'boolean' },
					// How to handle Visitor Abandonment setting
					visitorAbandonment: { type: 'string' },
					// Amount of chats placed on hold
					chatsOnHold: { type: 'integer' },
					// VoIP Enabled
					voipEnabled: { type: 'boolean' },
					// Amount of VoIP Calls
					voipCalls: { type: 'integer' },
					// Amount of VoIP Extensions connected
					voipExtensions: { type: 'integer' },
					// Amount of Calls that ended properly
					voipSuccessfulCalls: { type: 'integer' },
					// Amount of Calls that ended with an error
					voipErrorCalls: { type: 'integer' },
					// Amount of Calls that were put on hold
					voipOnHoldCalls: { type: 'integer' },
					omnichannelContactsBySource: {
						type: 'object',
						properties: {
							contactsCount: { type: 'integer' },
							conversationsCount: { type: 'integer' },
							sources: { type: 'array' },
						},
						required: ['contactsCount', 'conversationsCount'],
						additionalProperties: false,
					},
					uniqueContactsOfLastMonth: {
						type: 'object',
						properties: {
							contactsCount: { type: 'integer' },
							conversationsCount: { type: 'integer' },
							sources: { type: 'array' },
						},
						required: ['contactsCount', 'conversationsCount'],
						additionalProperties: false,
					},
					uniqueContactsOfLastWeek: {
						type: 'object',
						properties: {
							contactsCount: { type: 'integer' },
							conversationsCount: { type: 'integer' },
							sources: { type: 'array' },
						},
						required: ['contactsCount', 'conversationsCount'],
						additionalProperties: false,
					},
					uniqueContactsOfYesterday: {
						type: 'object',
						properties: {
							contactsCount: { type: 'integer' },
							conversationsCount: { type: 'integer' },
							sources: { type: 'array' },
						},
						required: ['contactsCount', 'conversationsCount'],
						additionalProperties: false,
					},
					totalChannelMessages: { type: 'integer' },
					totalPrivateGroupMessages: { type: 'integer' },
					totalDiscussionsMessages: { type: 'integer' },
					totalDirectMessages: { type: 'integer' },
					totalLivechatMessages: { type: 'integer' },
					totalMessages: { type: 'integer' },
					// Federation statistics
					federatedServers: { type: 'integer' },
					federatedUsers: { type: 'integer' },
					lastLogin: { type: 'string' },
					lastMessageSentAt: { anyOf: [{ type: 'string' }, { type: 'object' }] },
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
								items: [{ type: 'number' }],
								minItems: 0,
							},
							totalmem: { type: 'integer' },
							freemem: { type: 'integer' },
							cpus: { type: 'array' },
						},
						required: ['type', 'platform', 'arch', 'release', 'uptime', 'loadavg', 'totalmem', 'freemem', 'cpus'],
						additionalProperties: false,
					},
					process: {
						type: 'object',
						properties: {
							nodeVersion: { type: 'string' },
							pid: { type: 'integer' },
							uptime: { type: 'number' },
						},
						required: ['nodeVersion', 'pid', 'uptime'],
						additionalProperties: false,
					},
					deploy: {
						type: 'object',
						properties: {
							method: { type: 'string' },
							platform: { type: 'string' },
						},
						required: ['method', 'platform'],
						additionalProperties: false,
					},
					readReceiptsEnabled: { type: 'boolean' },
					readReceiptsDetailed: { type: 'boolean' },
					enterpriseReady: { type: 'boolean' },
					uploadsTotal: { type: 'integer' },
					uploadsTotalSize: { type: 'integer' },
					migration: {
						type: 'object',
						properties: {
							_id: { type: 'string' },
							version: { type: 'integer' },
							locked: { type: 'boolean' },
							hash: { type: 'string' },
							buildAt: {
								anyOf: [{ type: 'string' }, { type: 'object' }],
							},
							lockedAt: {
								anyOf: [{ type: 'string' }, { type: 'object' }],
							},
						},
						required: ['locked', 'version'],
						// FIXME: remove this when we have a proper migration schema
						// additionalProperties: false,
					},
					instanceCount: { type: 'integer' },
					msEnabled: { type: 'boolean' },
					oplogEnabled: { type: 'boolean' },
					mongoVersion: { type: 'string' },
					mongoStorageEngine: { type: 'string' },
					uniqueUsersOfYesterday: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueUsersOfLastWeek: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueUsersOfLastMonth: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueDevicesOfYesterday: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueDevicesOfLastWeek: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueDevicesOfLastMonth: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueOSOfYesterday: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueOSOfLastWeek: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
					},
					uniqueOSOfLastMonth: {
						type: 'object',
						properties: {
							year: { type: 'integer' },
							month: { type: 'integer' },
							day: { type: 'integer' },
							data: { type: 'array' },
						},
						required: ['year', 'month', 'day', 'data'],
						additionalProperties: false,
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
							totalPrivateApps: {
								anyOf: [{ type: 'integer' }, { const: false }],
							},
							totalPrivateAppsEnabled: {
								anyOf: [{ type: 'integer' }, { const: false }],
							},
						},
						required: ['engineVersion', 'totalInstalled', 'totalActive', 'totalFailed', 'totalPrivateApps', 'totalPrivateAppsEnabled'],
						additionalProperties: false,
					},
					services: { type: 'object' },
					importer: { type: 'object' },
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
								additionalProperties: false,
							},
							direct: {
								type: 'object',
								properties: {
									calling: { type: 'integer' },
									started: { type: 'integer' },
									ended: { type: 'integer' },
								},
								required: ['calling', 'started', 'ended'],
								additionalProperties: false,
							},
							livechat: {
								type: 'object',
								properties: {
									started: { type: 'integer' },
									ended: { type: 'integer' },
								},
								required: ['started', 'ended'],
								additionalProperties: false,
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
								// FIXME: dms and channels, groups, teams should be on becouse its not optional in the parant interface [IStats]
								required: ['provider'],
								additionalProperties: false,
							},
						},
						required: ['videoConference', 'direct', 'livechat', 'settings'],
						additionalProperties: false,
					},
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
					settings: {
						type: 'object',
						properties: {
							accounts: {
								type: 'object',
								properties: {
									account2fa: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							cannedResponses: {
								type: 'object',
								properties: {
									cannedResponsesEnabled: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							e2ee: {
								type: 'object',
								properties: {
									e2e: { type: 'boolean' },
									e2eDefaultDirectRoom: { type: 'boolean' },
									e2eDefaultPrivateRoom: { type: 'boolean' },
								},
								additionalProperties: false,
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
										additionalProperties: false,
									},
								},
								additionalProperties: false,
							},
							fileUpload: {
								type: 'object',
								properties: {
									fileUploadEnable: { type: 'boolean' },
								},
								additionalProperties: false,
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
										additionalProperties: false,
									},
									nps: {
										type: 'object',
										properties: {
											surveyEnabled: { type: 'boolean' },
										},
										additionalProperties: false,
									},
									update: {
										type: 'object',
										properties: {
											updateChecker: { type: 'boolean' },
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
							},
							liveStreamAndBroadcasting: {
								type: 'object',
								properties: {
									liveStream: { type: 'boolean' },
									broadcasting: { type: 'boolean' },
								},
								additionalProperties: false,
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
								additionalProperties: false,
							},
							otr: {
								type: 'object',
								properties: {
									otrEnable: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							push: {
								type: 'object',
								properties: {
									pushEnable: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							search: {
								type: 'object',
								properties: {
									defaultProvider: {
										type: 'object',
										properties: {
											globalSearchEnabled: { type: 'boolean' },
										},
										additionalProperties: false,
									},
								},
								additionalProperties: false,
							},
							threads: {
								type: 'object',
								properties: {
									threadsEnabled: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							videoConference: {
								type: 'object',
								properties: {
									bigBlueButton: { type: 'boolean' },
									jitsiEnabled: { type: 'boolean' },
								},
								additionalProperties: false,
							},
							webRTC: {
								type: 'object',
								properties: {
									webRTCEnableChannel: { type: 'boolean' },
									webRTCEnablePrivate: { type: 'boolean' },
									webRTCEnableDirect: { type: 'boolean' },
								},
								additionalProperties: false,
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
						additionalProperties: false,
					},
					pushQueue: { type: 'integer' },
					enterprise: {
						type: 'object',
						properties: {
							modules: {
								type: 'array',
								items: [{ type: 'string' }],
								minItems: 0,
							},
							tags: {
								type: 'array',
								items: [{ type: 'string' }],
								minItems: 0,
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
										additionalProperties: false,
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
										additionalProperties: false,
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
										additionalProperties: false,
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
										additionalProperties: false,
									},
								},
								additionalProperties: false,
							},
						},
						required: ['modules', 'tags', 'seatRequests'],
						additionalProperties: false,
					},
					teams: {
						type: 'object',
						properties: {
							totalTeams: { type: 'integer' },
							totalRoomsInsideTeams: { type: 'integer' },
							totalDefaultRoomsInsideTeams: { type: 'integer' },
						},
						required: ['totalTeams', 'totalDefaultRoomsInsideTeams', 'totalRoomsInsideTeams'],
						additionalProperties: false,
					},
					dashboardCount: { type: 'integer' },
					messageAuditApply: { type: 'integer' },
					messageAuditLoad: { type: 'integer' },
					joinJitsiButton: { type: 'integer' },
					slashCommandsJitsi: { type: 'integer' },
					totalOTRRooms: { type: 'integer' },
					totalOTR: { type: 'integer' },
					totalBroadcastRooms: { type: 'integer' },
					totalTriggeredEmails: { type: 'integer' },
					totalRoomsWithStarred: { type: 'integer' },
					totalRoomsWithPinned: { type: 'integer' },
					totalUserTOTP: { type: 'integer' },
					totalUserEmail2fa: { type: 'integer' },
					totalPinned: { type: 'integer' },
					totalStarred: { type: 'integer' },
					totalLinkInvitation: { type: 'integer' },
					totalLinkInvitationUses: { type: 'integer' },
					totalEmailInvitation: { type: 'integer' },
					totalE2ERooms: { type: 'integer' },
					logoChange: { type: 'boolean' },
					showHomeButton: { type: 'boolean' },
					totalEncryptedMessages: { type: 'integer' },
					totalManuallyAddedUsers: { type: 'integer' },
					totalSubscriptionRoles: { type: 'integer' },
					totalUserRoles: { type: 'integer' },
					totalCustomRoles: { type: 'integer' },
					totalWebRTCCalls: { type: 'integer' },
					uncaughtExceptionsCount: { type: 'integer' },
					// Push notification stats
					push: { type: 'integer' },
					pushSecured: { type: 'boolean' },
					homeTitleChanged: { type: 'boolean' },
					homeBodyChanged: { type: 'boolean' },
					customCSSChanged: { type: 'boolean' },
					onLogoutCustomScriptChanged: { type: 'boolean' },
					loggedOutCustomScriptChanged: { type: 'boolean' },
					loggedInCustomScriptChanged: { type: 'boolean' },
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
										additionalProperties: false,
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
										additionalProperties: false,
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
										items: [{ type: 'string' }],
										minItems: 0,
									},
								},
								required: ['quantity', 'servers'],
								additionalProperties: false,
							},
						},
					},
					// Omnichannel call stats
					webRTCEnabled: { type: 'boolean' },
					webRTCEnabledForOmnichannel: { type: 'boolean' },
					omnichannelWebRTCCalls: { type: 'integer' },
					// FIX: totalLivechatRoomsWithPriority created in the interface and used in server lib
					totalLivechatRoomsWithPriority: { type: 'integer' },
					// FIX: federationOverviewData created in the interface and used in server lib
					federationOverviewData: {
						type: 'object',
						properties: {
							numberOfEvents: { type: 'integer' },
							numberOfFederatedUsers: { type: 'integer' },
							numberOfServers: { type: 'integer' },
						},
					},
					createdAt: {
						anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'object' }],
					},
					// FIX: roomsInsideTeams created in the interface and used in server lib
					roomsInsideTeams: { type: 'integer' },
					statsToken: { type: 'string' },
					success: {
						type: 'boolean',
						description: 'Indicates if the request was successful.',
					},
				},
				required: ['success'],
				// TODO: remove this when we have a proper statistics schema
				// additionalProperties: false,
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},
	async function action() {
		const { refresh = 'false' } = this.queryParams;
		return API.v1.success(
			await getLastStatistics({
				userId: this.userId,
				refresh: refresh === 'true',
			}),
		);
	},
);

type StatisticsListProps = {
	offset: number;
	count?: number;
};

const StatisticsListSchema = {
	type: 'object',
	properties: {
		offset: {
			type: 'number',
			default: 0,
			minimum: 0,
		},
		count: {
			type: 'number',
			default: 100,
			minimum: 1,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isStatisticsListProps = ajv.compile<StatisticsListProps>(StatisticsListSchema);

const statisticsListEndpoints = API.v1.get(
	'statistics.list',
	{
		authRequired: true,
		query: isStatisticsListProps,
		response: {
			200: ajv.compile<{ statistics: IStats[]; count: number; offset: number; total: number }>({
				type: 'object',
				properties: {
					statistics: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								// Setup Wizard
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
									additionalProperties: false,
								},
								// Version
								uniqueId: { type: 'string' },
								installedAt: { type: 'string' },
								deploymentFingerprintHash: { type: 'string' },
								deploymentFingerprintVerified: { type: 'boolean' },
								version: { type: 'string' },
								tag: { type: 'string' },
								branch: { type: 'string' },
								// User statistics
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
								// Room statistics
								totalRooms: { type: 'integer' },
								totalChannels: { type: 'integer' },
								totalPrivateGroups: { type: 'integer' },
								totalDirect: { type: 'integer' },
								totalLivechat: { type: 'integer' },
								totalDiscussions: { type: 'integer' },
								totalThreads: { type: 'integer' },
								// livechat visitors
								totalLivechatVisitors: { type: 'integer' },
								// livechat agents
								totalLivechatAgents: { type: 'integer' },
								totalLivechatManagers: { type: 'integer' },
								// livechat enabled
								livechatEnabled: { type: 'boolean' },
								// Count and types of omnichannel rooms
								omnichannelSources: {
									type: 'array',
									items: [
										{
											type: 'object',
											properties: {
												id: { type: 'string' },
												type: { type: 'string' },
												count: { type: 'number' },
												alias: { type: 'string' },
											},
											additionalProperties: false,
										},
									],
									minItems: 0,
								},
								// Number of livechat rooms with department
								totalLivechatRoomsWithDepartment: { type: 'integer' },
								// Number of departments
								departments: { type: 'integer' },
								// Number of archived departments
								archivedDepartments: { type: 'integer' },
								// Workspace allows dpeartment removal
								isDepartmentRemovalEnabled: { type: 'boolean' },
								// Number of triggers
								totalTriggers: { type: 'integer' },
								// Number of custom fields
								totalCustomFields: { type: 'integer' },
								// Number of public custom fields
								totalLivechatPublicCustomFields: { type: 'integer' },
								// Livechat Automatic forwarding feature enabled
								livechatAutomaticForwardingUnansweredChats: { type: 'boolean' },
								// Type of routing algorithm used on omnichannel
								routingAlgorithm: { type: 'string' },
								// is on-hold active
								onHoldEnabled: { type: 'boolean' },
								// Number of Email Inboxes
								emailInboxes: { type: 'integer' },
								BusinessHours: {
									type: 'object',
									properties: {
										// Number of Business Hours
										total: { type: 'number' },
										// Business Hours strategy
										strategy: { type: 'string' },
									},
									required: ['total', 'strategy'],
									additionalProperties: false,
								},
								// Last-Chatted Agent Preferred (enabled/disabled)
								lastChattedAgentPreferred: { type: 'boolean' },
								// Assign new conversations to the contact manager (enabled/disabled)
								assignNewConversationsToContactManager: { type: 'boolean' },
								// How to handle Visitor Abandonment setting
								visitorAbandonment: { type: 'string' },
								// Amount of chats placed on hold
								chatsOnHold: { type: 'integer' },
								// VoIP Enabled
								voipEnabled: { type: 'boolean' },
								// Amount of VoIP Calls
								voipCalls: { type: 'integer' },
								// Amount of VoIP Extensions connected
								voipExtensions: { type: 'integer' },
								// Amount of Calls that ended properly
								voipSuccessfulCalls: { type: 'integer' },
								// Amount of Calls that ended with an error
								voipErrorCalls: { type: 'integer' },
								// Amount of Calls that were put on hold
								voipOnHoldCalls: { type: 'integer' },
								omnichannelContactsBySource: {
									type: 'object',
									properties: {
										contactsCount: { type: 'integer' },
										conversationsCount: { type: 'integer' },
										sources: { type: 'array' },
									},
									required: ['contactsCount', 'conversationsCount'],
									additionalProperties: false,
								},
								uniqueContactsOfLastMonth: {
									type: 'object',
									properties: {
										contactsCount: { type: 'integer' },
										conversationsCount: { type: 'integer' },
										sources: { type: 'array' },
									},
									required: ['contactsCount', 'conversationsCount'],
									additionalProperties: false,
								},
								uniqueContactsOfLastWeek: {
									type: 'object',
									properties: {
										contactsCount: { type: 'integer' },
										conversationsCount: { type: 'integer' },
										sources: { type: 'array' },
									},
									required: ['contactsCount', 'conversationsCount'],
									additionalProperties: false,
								},
								uniqueContactsOfYesterday: {
									type: 'object',
									properties: {
										contactsCount: { type: 'integer' },
										conversationsCount: { type: 'integer' },
										sources: { type: 'array' },
									},
									required: ['contactsCount', 'conversationsCount'],
									additionalProperties: false,
								},
								totalChannelMessages: { type: 'integer' },
								totalPrivateGroupMessages: { type: 'integer' },
								totalDiscussionsMessages: { type: 'integer' },
								totalDirectMessages: { type: 'integer' },
								totalLivechatMessages: { type: 'integer' },
								totalMessages: { type: 'integer' },
								// Federation statistics
								federatedServers: { type: 'integer' },
								federatedUsers: { type: 'integer' },
								lastLogin: { type: 'string' },
								lastMessageSentAt: { anyOf: [{ type: 'string' }, { type: 'object' }] },
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
											items: [{ type: 'number' }],
											minItems: 0,
										},
										totalmem: { type: 'integer' },
										freemem: { type: 'integer' },
										cpus: { type: 'array' },
									},
									required: ['type', 'platform', 'arch', 'release', 'uptime', 'loadavg', 'totalmem', 'freemem', 'cpus'],
									additionalProperties: false,
								},
								process: {
									type: 'object',
									properties: {
										nodeVersion: { type: 'string' },
										pid: { type: 'integer' },
										uptime: { type: 'number' },
									},
									required: ['nodeVersion', 'pid', 'uptime'],
									additionalProperties: false,
								},
								deploy: {
									type: 'object',
									properties: {
										method: { type: 'string' },
										platform: { type: 'string' },
									},
									required: ['method', 'platform'],
									additionalProperties: false,
								},
								readReceiptsEnabled: { type: 'boolean' },
								readReceiptsDetailed: { type: 'boolean' },
								enterpriseReady: { type: 'boolean' },
								uploadsTotal: { type: 'integer' },
								uploadsTotalSize: { type: 'integer' },
								migration: {
									type: 'object',
									properties: {
										_id: { type: 'string' },
										version: { type: 'integer' },
										locked: { type: 'boolean' },
										hash: { type: 'string' },
										buildAt: {
											anyOf: [{ type: 'string' }, { type: 'object' }],
										},
										lockedAt: {
											anyOf: [{ type: 'string' }, { type: 'object' }],
										},
									},
									required: ['locked', 'version'],
									// FIXME: remove this when we have a proper migration schema
									// additionalProperties: false,
								},
								instanceCount: { type: 'integer' },
								msEnabled: { type: 'boolean' },
								oplogEnabled: { type: 'boolean' },
								mongoVersion: { type: 'string' },
								mongoStorageEngine: { type: 'string' },
								uniqueUsersOfYesterday: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueUsersOfLastWeek: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueUsersOfLastMonth: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueDevicesOfYesterday: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueDevicesOfLastWeek: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueDevicesOfLastMonth: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueOSOfYesterday: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueOSOfLastWeek: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
								},
								uniqueOSOfLastMonth: {
									type: 'object',
									properties: {
										year: { type: 'integer' },
										month: { type: 'integer' },
										day: { type: 'integer' },
										data: { type: 'array' },
									},
									required: ['year', 'month', 'day', 'data'],
									additionalProperties: false,
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
										totalPrivateApps: {
											anyOf: [{ type: 'integer' }, { const: false }],
										},
										totalPrivateAppsEnabled: {
											anyOf: [{ type: 'integer' }, { const: false }],
										},
									},
									required: [
										'engineVersion',
										'totalInstalled',
										'totalActive',
										'totalFailed',
										'totalPrivateApps',
										'totalPrivateAppsEnabled',
									],
									additionalProperties: false,
								},
								services: { type: 'object' },
								importer: { type: 'object' },
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
											additionalProperties: false,
										},
										direct: {
											type: 'object',
											properties: {
												calling: { type: 'integer' },
												started: { type: 'integer' },
												ended: { type: 'integer' },
											},
											required: ['calling', 'started', 'ended'],
											additionalProperties: false,
										},
										livechat: {
											type: 'object',
											properties: {
												started: { type: 'integer' },
												ended: { type: 'integer' },
											},
											required: ['started', 'ended'],
											additionalProperties: false,
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
											// FIXME: dms and channels, groups, teams should be on becouse its not optional in the parant interface [IStats]
											required: ['provider'],
											additionalProperties: false,
										},
									},
									required: ['videoConference', 'direct', 'livechat', 'settings'],
									additionalProperties: false,
								},
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
								settings: {
									type: 'object',
									properties: {
										accounts: {
											type: 'object',
											properties: {
												account2fa: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										cannedResponses: {
											type: 'object',
											properties: {
												cannedResponsesEnabled: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										e2ee: {
											type: 'object',
											properties: {
												e2e: { type: 'boolean' },
												e2eDefaultDirectRoom: { type: 'boolean' },
												e2eDefaultPrivateRoom: { type: 'boolean' },
											},
											additionalProperties: false,
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
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
										fileUpload: {
											type: 'object',
											properties: {
												fileUploadEnable: { type: 'boolean' },
											},
											additionalProperties: false,
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
													additionalProperties: false,
												},
												nps: {
													type: 'object',
													properties: {
														surveyEnabled: { type: 'boolean' },
													},
													additionalProperties: false,
												},
												update: {
													type: 'object',
													properties: {
														updateChecker: { type: 'boolean' },
													},
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
										liveStreamAndBroadcasting: {
											type: 'object',
											properties: {
												liveStream: { type: 'boolean' },
												broadcasting: { type: 'boolean' },
											},
											additionalProperties: false,
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
											additionalProperties: false,
										},
										otr: {
											type: 'object',
											properties: {
												otrEnable: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										push: {
											type: 'object',
											properties: {
												pushEnable: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										search: {
											type: 'object',
											properties: {
												defaultProvider: {
													type: 'object',
													properties: {
														globalSearchEnabled: { type: 'boolean' },
													},
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
										threads: {
											type: 'object',
											properties: {
												threadsEnabled: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										videoConference: {
											type: 'object',
											properties: {
												bigBlueButton: { type: 'boolean' },
												jitsiEnabled: { type: 'boolean' },
											},
											additionalProperties: false,
										},
										webRTC: {
											type: 'object',
											properties: {
												webRTCEnableChannel: { type: 'boolean' },
												webRTCEnablePrivate: { type: 'boolean' },
												webRTCEnableDirect: { type: 'boolean' },
											},
											additionalProperties: false,
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
									additionalProperties: false,
								},
								pushQueue: { type: 'integer' },
								enterprise: {
									type: 'object',
									properties: {
										modules: {
											type: 'array',
											items: [{ type: 'string' }],
											minItems: 0,
										},
										tags: {
											type: 'array',
											items: [{ type: 'string' }],
											minItems: 0,
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
													additionalProperties: false,
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
													additionalProperties: false,
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
													additionalProperties: false,
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
													additionalProperties: false,
												},
											},
											additionalProperties: false,
										},
									},
									required: ['modules', 'tags', 'seatRequests'],
									additionalProperties: false,
								},
								teams: {
									type: 'object',
									properties: {
										totalTeams: { type: 'integer' },
										totalRoomsInsideTeams: { type: 'integer' },
										totalDefaultRoomsInsideTeams: { type: 'integer' },
									},
									required: ['totalTeams', 'totalDefaultRoomsInsideTeams', 'totalRoomsInsideTeams'],
									additionalProperties: false,
								},
								dashboardCount: { type: 'integer' },
								messageAuditApply: { type: 'integer' },
								messageAuditLoad: { type: 'integer' },
								joinJitsiButton: { type: 'integer' },
								slashCommandsJitsi: { type: 'integer' },
								totalOTRRooms: { type: 'integer' },
								totalOTR: { type: 'integer' },
								totalBroadcastRooms: { type: 'integer' },
								totalTriggeredEmails: { type: 'integer' },
								totalRoomsWithStarred: { type: 'integer' },
								totalRoomsWithPinned: { type: 'integer' },
								totalUserTOTP: { type: 'integer' },
								totalUserEmail2fa: { type: 'integer' },
								totalPinned: { type: 'integer' },
								totalStarred: { type: 'integer' },
								totalLinkInvitation: { type: 'integer' },
								totalLinkInvitationUses: { type: 'integer' },
								totalEmailInvitation: { type: 'integer' },
								totalE2ERooms: { type: 'integer' },
								logoChange: { type: 'boolean' },
								showHomeButton: { type: 'boolean' },
								totalEncryptedMessages: { type: 'integer' },
								totalManuallyAddedUsers: { type: 'integer' },
								totalSubscriptionRoles: { type: 'integer' },
								totalUserRoles: { type: 'integer' },
								totalCustomRoles: { type: 'integer' },
								totalWebRTCCalls: { type: 'integer' },
								uncaughtExceptionsCount: { type: 'integer' },
								// Push notification stats
								push: { type: 'integer' },
								pushSecured: { type: 'boolean' },
								homeTitleChanged: { type: 'boolean' },
								homeBodyChanged: { type: 'boolean' },
								customCSSChanged: { type: 'boolean' },
								onLogoutCustomScriptChanged: { type: 'boolean' },
								loggedOutCustomScriptChanged: { type: 'boolean' },
								loggedInCustomScriptChanged: { type: 'boolean' },
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
													additionalProperties: false,
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
													additionalProperties: false,
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
													items: [{ type: 'string' }],
													minItems: 0,
												},
											},
											required: ['quantity', 'servers'],
											additionalProperties: false,
										},
									},
								},
								// Omnichannel call stats
								webRTCEnabled: { type: 'boolean' },
								webRTCEnabledForOmnichannel: { type: 'boolean' },
								omnichannelWebRTCCalls: { type: 'integer' },
								// FIX: totalLivechatRoomsWithPriority created in the interface and used in server lib
								totalLivechatRoomsWithPriority: { type: 'integer' },
								// FIX: federationOverviewData created in the interface and used in server lib
								federationOverviewData: {
									type: 'object',
									properties: {
										numberOfEvents: { type: 'integer' },
										numberOfFederatedUsers: { type: 'integer' },
										numberOfServers: { type: 'integer' },
									},
								},
								createdAt: {
									anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'object' }],
								},
								// FIX: roomsInsideTeams created in the interface and used in server lib
								roomsInsideTeams: { type: 'integer' },
								statsToken: { type: 'string' },
							},
							required: [],
							// TODO: remove this when we have a proper statistics schema
							// additionalProperties: false,
						},
						minItems: 0,
					},
					count: { type: 'integer', minimum: 1 },
					offset: { type: 'integer', minimum: 0, default: 0 },
					total: { type: 'integer', minimum: 1 },
					success: { type: 'boolean', enum: [true] },
				},
				additionalProperties: false,
				required: ['statistics', 'count', 'offset', 'total', 'success'],
			}),
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},
	async function action() {
		const { offset, count } = await getPaginationItems(this.queryParams);
		const { sort, fields, query } = await this.parseJsonQuery();

		return API.v1.success(
			await getStatistics({
				userId: this.userId,
				query,
				pagination: {
					offset,
					count,
					sort,
					fields,
				},
			}),
		);
	},
);

type OTREnded = { rid: string };

type SlashCommand = { command: string };

type SettingsCounter = { settingsId: string };

export type TelemetryMap = { otrStats: OTREnded; slashCommandsStats: SlashCommand; updateCounter: SettingsCounter };

export type TelemetryEvents = keyof TelemetryMap;

type Param = {
	eventName: TelemetryEvents;
	timestamp?: number;
} & (OTREnded | SlashCommand | SettingsCounter);

type TelemetryPayload = {
	params: Param[];
};

const statisticsTelemetryEndpoints = API.v1.post(
	'statistics.telemetry',
	{
		authRequired: true,
		body: ajv.compile<TelemetryPayload>({
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
			400: ajv.compile<{
				error?: string;
				errorType?: string;
				stack?: string;
				details?: string;
			}>({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [false] },
					stack: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
					details: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: ajv.compile({
				type: 'object',
				properties: {
					success: {
						type: 'boolean',
						enum: [false],
					},
					status: { type: 'string' },
					message: { type: 'string' },
					error: { type: 'string' },
					errorType: { type: 'string' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},
	async function action() {
		const events = this.bodyParams;

		events?.params?.forEach((event) => {
			const { eventName, ...params } = event;
			void telemetryEvent.call(eventName, params);
		});

		return API.v1.success();
	},
);

type StatisticsEndpoint = ExtractRoutesFromAPI<typeof statisticsEndpoints>;

type StatisticsListEndpoints = ExtractRoutesFromAPI<typeof statisticsListEndpoints>;

type StatisticsTelemetryEndpoints = ExtractRoutesFromAPI<typeof statisticsTelemetryEndpoints>;

export type StatisticsEndpoints = StatisticsEndpoint | StatisticsListEndpoints | StatisticsTelemetryEndpoints;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsEndpoint {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsListEndpoints {}
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends StatisticsTelemetryEndpoints {}
}
