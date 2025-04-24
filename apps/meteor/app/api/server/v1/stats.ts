import type { TelemetryMap } from '@rocket.chat/core-services';
import { ajv } from '@rocket.chat/rest-typings/src/v1/Ajv';

import { getStatistics, getLastStatistics } from '../../../statistics/server';
import telemetryEvent from '../../../statistics/server/lib/telemetryEvents';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

type ConvertedTelemetryMap<T extends keyof TelemetryMap = keyof TelemetryMap> = {
	eventName: T;
} & TelemetryMap[T];

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
						},
						uniqueId: { type: 'string' },
						installedAt: { type: 'string' },
						branch: {
							anyOf: [{ type: 'null' }, {}],
						}, // FIXME: Always return null
						tag: {
							anyOf: [{ type: 'null' }, {}],
						}, // FIXME: Always return null
						deploymentFingerprintHash: { type: 'string' },
						deploymentFingerprintVerified: { type: 'boolean' },
						version: { type: 'string' },
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
							properties: {
								none: { type: 'integer' },
								es: { type: 'integer' },
							},
						},
						totalRooms: { type: 'integer' },
						totalChannels: { type: 'integer' },
						totalPrivateGroups: { type: 'integer' },
						totalDirect: { type: 'integer' },
						totalLivechat: { type: 'integer' },
						totalDiscussions: { type: 'integer' },
						totalThreads: { type: 'integer' },
						totalLivechatVisitors: { type: 'integer' },
						totalLivechatAgents: { type: 'integer' },
						totalLivechatManagers: { type: 'integer' },
						livechatEnabled: { type: 'boolean' },
						isDepartmentRemovalEnabled: { type: 'boolean' },
						totalTriggers: { type: 'integer' },
						archivedDepartments: { type: 'integer' },
						departments: { type: 'integer' },
						totalCustomFields: { type: 'integer' },
						omnichannelSources: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									id: {
										anyOf: [{ type: 'null' }, {}],
									}, // FIXME: Always return null
									alias: {
										anyOf: [{ type: 'null' }, {}],
									}, // FIXME: Always return null
									type: { type: 'string' },
									count: { type: 'integer' },
								},
							},
						},
						totalLivechatPublicCustomFields: { type: 'integer' },
						totalLivechatRoomsWithDepartment: { type: 'integer' },
						livechatAutomaticForwardingUnansweredChats: { type: 'boolean' },
						routingAlgorithm: { type: 'string' },
						onHoldEnabled: { type: 'boolean' },
						lastChattedAgentPreferred: { type: 'boolean' },
						assignNewConversationsToContactManager: { type: 'boolean' },
						visitorAbandonment: { type: 'string' },
						voipEnabled: { type: 'boolean' },
						emailInboxes: { type: 'integer' },
						BusinessHours: {
							type: 'object',
							properties: {
								total: { type: 'integer' },
								strategy: { type: 'string' },
							},
						},
						voipCalls: { type: 'integer' },
						voipExtensions: { type: 'integer' },
						chatsOnHold: { type: 'integer' },
						voipSuccessfulCalls: { type: 'integer' },
						voipErrorCalls: { type: 'integer' },
						voipOnHoldCalls: { type: 'integer' },
						omnichannelContactsBySource: {
							type: 'object',
							properties: {
								contactsCount: { type: 'integer' },
								conversationsCount: { type: 'integer' },
								sources: {
									type: 'array',
								},
							},
						},
						uniqueContactsOfLastWeek: {
							type: 'object',
							properties: {
								contactsCount: { type: 'integer' },
								conversationsCount: { type: 'integer' },
								sources: {
									type: 'array',
								},
							},
						},
						uniqueContactsOfLastMonth: {
							type: 'object',
							properties: {
								contactsCount: { type: 'integer' },
								conversationsCount: { type: 'integer' },
								sources: {
									type: 'array',
								},
							},
						},
						uniqueContactsOfYesterday: {
							type: 'object',
							properties: {
								contactsCount: { type: 'integer' },
								conversationsCount: { type: 'integer' },
								sources: {
									type: 'array',
								},
							},
						},
						totalChannelMessages: { type: 'integer' },
						totalPrivateGroupMessages: { type: 'integer' },
						totalDiscussionsMessages: { type: 'integer' },
						totalDirectMessages: { type: 'integer' },
						totalLivechatMessages: { type: 'integer' },
						totalMessages: { type: 'integer' },
						lastLogin: { type: 'string' },
						lastMessageSentAt: { type: 'object' }, // TODO: convert `lastMessageSentAt` from JavaScript `Date` object to string
						federatedServers: { type: 'integer' },
						federatedUsers: { type: 'integer' },
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
						},
						process: {
							type: 'object',
							properties: {
								nodeVersion: { type: 'string' },
								pid: { type: 'integer' },
								uptime: { type: 'number' },
							},
						},
						deploy: {
							type: 'object',
							properties: {
								method: { type: 'string' },
								platform: { type: 'string' },
							},
						},
						readReceiptsEnabled: { type: 'boolean' },
						readReceiptsDetailed: { type: 'boolean' },
						enterpriseReady: { type: 'boolean' },
						uploadsTotal: { type: 'integer' },
						migration: {
							type: 'object',
							properties: {
								_id: { type: 'string' },
								_updatedAt: { type: 'object' }, // TODO: convert `_updatedAt` from JavaScript `Date` object to string
								locked: { type: 'boolean' },
								version: { type: 'integer' },
								buildAt: { type: 'string' },
								lockedAt: { type: 'object' }, // TODO: convert `lockedAt` from JavaScript `Date` object to string
							},
						},
						uploadsTotalSize: { type: 'integer' },
						instanceCount: { type: 'integer' },
						msEnabled: { type: 'boolean' },
						oplogEnabled: { type: 'boolean' },
						mongoVersion: { type: 'string' },
						mongoStorageEngine: { type: 'string' },
						apps: {
							type: 'object',
							properties: {
								engineVersion: { type: 'string' },
								totalInstalled: { type: 'integer' },
								totalActive: { type: 'integer' },
								totalFailed: { type: 'integer' },
								totalPrivateApps: { type: 'integer' },
								totalPrivateAppsEnabled: { type: 'integer' },
							},
						},
						uniqueUsersOfYesterday: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueDevicesOfYesterday: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueUsersOfLastWeek: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueOSOfYesterday: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueDevicesOfLastMonth: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueOSOfLastWeek: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueDevicesOfLastWeek: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueUsersOfLastMonth: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						uniqueOSOfLastMonth: {
							type: 'object',
							properties: {
								year: { type: 'integer' },
								month: { type: 'integer' },
								day: { type: 'integer' },
								data: { type: 'array' },
							},
						},
						services: {
							type: 'object',
							properties: {
								ldap: {
									type: 'object',
									properties: {
										users: { type: 'integer' },
										enabled: { type: 'boolean' },
										loginFallback: { type: 'boolean' },
										encryption: { type: 'string' },
										mergeUsers: { type: 'boolean' },
										syncRoles: { type: 'boolean' },
										syncRolesAutoRemove: { type: 'boolean' },
										syncData: { type: 'boolean' },
										syncChannels: { type: 'boolean' },
										syncAvatar: { type: 'boolean' },
										groupFilter: { type: 'boolean' },
										backgroundSync: { type: 'object' },
										ee: { type: 'object' },
									},
								},
								saml: {
									type: 'object',
									properties: {
										enabled: { type: 'boolean' },
										users: { type: 'integer' },
										signatureValidationType: { type: 'string' },
										generateUsername: { type: 'boolean' },
										updateSubscriptionsOnLogin: { type: 'boolean' },
										syncRoles: { type: 'boolean' },
										userDataCustomFieldMap: { type: 'boolean' },
									},
								},
								cas: {
									type: 'object',
									properties: {
										enabled: { type: 'boolean' },
										users: { type: 'integer' },
										allowUserCreation: { type: 'boolean' },
										alwaysSyncUserData: { type: 'boolean' },
									},
								},
								oauth: {
									type: 'object',
									properties: {
										apple: { type: 'object' },
										dolphin: { type: 'object' },
										drupal: { type: 'object' },
										facebook: { type: 'object' },
										github: { type: 'object' },
										githubEnterprise: { type: 'object' },
										gitlab: { type: 'object' },
										google: { type: 'object' },
										linkedin: { type: 'object' },
										meteor: { type: 'object' },
										nextcloud: { type: 'object' },
										tokenpass: { type: 'object' },
										twitter: { type: 'object' },
										wordpress: { type: 'object' },
										custom: { type: 'object' },
									},
								},
							},
						},
						importer: {
							type: 'object',
							properties: {
								totalCSVImportedUsers: { type: 'integer' },
								totalHipchatEnterpriseImportedUsers: { type: 'integer' },
								totalSlackImportedUsers: { type: 'integer' },
								totalSlackUsersImportedUsers: { type: 'integer' },
							},
						},
						videoConf: {
							type: 'object',
							properties: {
								videoConference: {
									type: 'object',
									properties: {
										started: { type: 'integer' },
										ended: { type: 'integer' },
									},
								},
								direct: {
									type: 'object',
									properties: {
										calling: { type: 'integer' },
										started: { type: 'integer' },
										ended: { type: 'integer' },
									},
								},
								livechat: {
									type: 'object',
									properties: {
										started: { type: 'integer' },
										ended: { type: 'integer' },
									},
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
								},
							},
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
						dashboardCount: { type: 'integer' },
						messageAuditApply: { type: 'integer' },
						messageAuditLoad: { type: 'integer' },
						joinJitsiButton: { type: 'integer' },
						slashCommandsJitsi: { type: 'integer' },
						settings: {
							type: 'object',
							properties: {
								accounts: {
									type: 'object',
									properties: {
										account2fa: { type: 'boolean' },
									},
								},
								cannedResponses: {
									type: 'object',
									properties: {
										cannedResponsesEnabled: { type: 'boolean' },
									},
								},
								e2ee: {
									type: 'object',
									properties: {
										e2e: { type: 'boolean' },
										e2eDefaultDirectRoom: { type: 'boolean' },
										e2eDefaultPrivateRoom: { type: 'boolean' },
									},
								},
								email: {
									type: 'object',
								},
								fileUpload: {
									type: 'object',
									properties: {
										fileUploadEnable: { type: 'boolean' },
									},
								},
								general: {
									type: 'object',
								},
								liveStreamAndBroadcasting: {
									type: 'object',
									properties: {
										liveStream: {
											anyOf: [{ type: 'null' }, {}],
										}, // FIXME: Always return null
									},
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
								},
								otr: {
									type: 'object',
									properties: {
										otrEnable: { type: 'boolean' },
									},
								},
								push: {
									type: 'object',
									properties: {
										pushEnable: { type: 'boolean' },
									},
								},
								search: {
									type: 'object',
								},
								threads: {
									type: 'object',
									properties: {
										threadsEnabled: { type: 'boolean' },
									},
								},
								webRTC: {
									type: 'object',
									properties: {
										webRTCEnableChannel: { type: 'boolean' },
										webRTCEnablePrivate: { type: 'boolean' },
										webRTCEnableDirect: { type: 'boolean' },
									},
								},
							},
						},
						pushQueue: { type: 'integer' },
						totalOTRRooms: { type: 'integer' },
						totalOTR: { type: 'integer' },
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
						},
						totalBroadcastRooms: { type: 'integer' },
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
								cannedResponses: { type: 'integer' },
								livechatTags: { type: 'integer' },
								slas: { type: 'integer' },
								omnichannelRoomsWithPriorities: { type: 'integer' },
								omnichannelRoomsWithSlas: { type: 'integer' },
								businessUnits: { type: 'integer' },
								livechatMonitors: { type: 'integer' },
								omnichannelPdfTranscriptSucceeded: { type: 'integer' },
								omnichannelPdfTranscriptRequested: { type: 'integer' },
							},
							required: ['modules', 'tags', 'seatRequests'],
						},
						teams: {
							type: 'object',
							properties: {
								totalTeams: { type: 'integer' },
								totalRoomsInsideTeams: { type: 'integer' },
								totalDefaultRoomsInsideTeams: { type: 'integer' },
							},
							required: ['totalTeams', 'totalDefaultRoomsInsideTeams', 'totalRoomsInsideTeams'],
						},
						totalRoomsWithActiveLivestream: { type: 'integer' },
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
								maximumSizeOfPublicRoomsUsers: { type: 'boolean' },
								biggestRoom: { type: 'string', nullable: true },
								smallestRoom: { type: 'string', nullable: true },
								amountOfExternalUsers: { type: 'integer' },
								amountOfFederatedRooms: { type: 'integer' },
								externalConnectedServers: {
									type: 'object',
									properties: {
										quantity: { type: 'integer' },
										servers: { type: 'array' },
									},
								},
							},
						},
						webRTCEnabled: { type: 'boolean' },
						webRTCEnabledForOmnichannel: { type: 'boolean' },
						omnichannelWebRTCCalls: { type: 'integer' },
						createdAt: { type: 'object' }, // TODO: convert `createdAt` from JavaScript `Date` object to string
						_updatedAt: { type: 'object' }, // TODO: convert `_updatedAt` from JavaScript `Date` object to string
						statsToken: { type: 'string' },
						success: {
							type: 'boolean',
							description: 'Indicates if the request was successful.',
						},
					},
					required: [
						'_id',
						'wizard',
						'uniqueId',
						'installedAt',
						// 'branch',
						// 'tag',
						'deploymentFingerprintHash',
						'deploymentFingerprintVerified',
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
						'userLanguages',
						'totalRooms',
						'totalChannels',
						'totalPrivateGroups',
						'totalDirect',
						'totalLivechat',
						'totalDiscussions',
						'totalThreads',
						'totalLivechatVisitors',
						'totalLivechatAgents',
						'totalLivechatManagers',
						'livechatEnabled',
						'isDepartmentRemovalEnabled',
						'totalTriggers',
						'archivedDepartments',
						'departments',
						'totalCustomFields',
						'omnichannelSources',
						'totalLivechatPublicCustomFields',
						'totalLivechatRoomsWithDepartment',
						'livechatAutomaticForwardingUnansweredChats',
						'routingAlgorithm',
						'onHoldEnabled',
						'lastChattedAgentPreferred',
						'assignNewConversationsToContactManager',
						'visitorAbandonment',
						'voipEnabled',
						'emailInboxes',
						'BusinessHours',
						'voipCalls',
						'voipExtensions',
						'chatsOnHold',
						'voipSuccessfulCalls',
						'voipErrorCalls',
						'voipOnHoldCalls',
						'omnichannelContactsBySource',
						'uniqueContactsOfLastWeek',
						'uniqueContactsOfLastMonth',
						'uniqueContactsOfYesterday',
						'totalChannelMessages',
						'totalPrivateGroupMessages',
						'totalDiscussionsMessages',
						'totalDirectMessages',
						'totalLivechatMessages',
						'totalMessages',
						'lastLogin',
						'lastMessageSentAt',
						'federatedServers',
						'federatedUsers',
						'lastSeenSubscription',
						'os',
						'process',
						'deploy',
						'readReceiptsEnabled',
						'readReceiptsDetailed',
						'enterpriseReady',
						'uploadsTotal',
						'migration',
						'uploadsTotalSize',
						'instanceCount',
						'msEnabled',
						'oplogEnabled',
						'mongoVersion',
						'mongoStorageEngine',
						'apps',
						'uniqueUsersOfYesterday',
						'uniqueDevicesOfYesterday',
						'uniqueUsersOfLastWeek',
						'uniqueOSOfYesterday',
						'uniqueDevicesOfLastMonth',
						'uniqueOSOfLastWeek',
						'uniqueDevicesOfLastWeek',
						'uniqueUsersOfLastMonth',
						'uniqueOSOfLastMonth',
						'services',
						'importer',
						'videoConf',
						`contactVerification`,
						'dashboardCount',
						'messageAuditApply',
						'messageAuditLoad',
						'joinJitsiButton',
						'slashCommandsJitsi',
						'settings',
						'pushQueue',
						'totalOTRRooms',
						'totalOTR',
						'integrations',
						'totalBroadcastRooms',
						'enterprise',
						'teams',
						// 'totalRoomsWithActiveLivestream',
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
						'totalCustomRoles',
						'totalWebRTCCalls',
						'uncaughtExceptionsCount',
						'push',
						'pushSecured',
						'homeTitleChanged',
						'homeBodyChanged',
						'customCSSChanged',
						'onLogoutCustomScriptChanged',
						'loggedOutCustomScriptChanged',
						'loggedInCustomScriptChanged',
						'dailyPeakConnections',
						'maxMonthlyPeakConnections',
						'matrixFederation',
						'webRTCEnabled',
						'webRTCEnabledForOmnichannel',
						'omnichannelWebRTCCalls',
						'createdAt',
						// '_updatedAt',
						// 'statsToken',
						'success',
					],
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
			},
		},
		async function () {
			const { refresh = 'false' } = this.queryParams;
			const statistics = await getLastStatistics({
				userId: this.userId,
				refresh: refresh === 'true',
			});
			return API.v1.success({ ...statistics, success: true });
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
							},
						},
						count: { type: 'integer', minimum: 1, default: 25 },
						offset: { type: 'integer', minimum: 0, default: 0 },
						total: { type: 'integer', minimum: 1, default: 25 },
						success: { type: 'boolean' },
					},
					additionalProperties: false,
					required: ['statistics', 'success'],
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
