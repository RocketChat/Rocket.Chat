import { log } from 'console';
import os from 'os';

import { Analytics, Team, VideoConf, Presence } from '@rocket.chat/core-services';
import type { IRoom, IStats, ISetting } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import {
	NotificationQueue,
	Rooms,
	Statistics,
	Sessions,
	Integrations,
	Invites,
	Uploads,
	LivechatDepartment,
	LivechatVisitors,
	EmailInbox,
	LivechatBusinessHours,
	Messages,
	Roles as RolesRaw,
	InstanceStatus,
	Settings,
	LivechatTrigger,
	LivechatCustomField,
	Subscriptions,
	Users,
	LivechatRooms,
} from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';
import moment from 'moment';

import { getAppsStatistics } from './getAppsStatistics';
import { getContactVerificationStatistics } from './getContactVerificationStatistics';
import { getStatistics as getEnterpriseStatistics } from './getEEStatistics';
import { getImporterStatistics } from './getImporterStatistics';
import { getServicesStatistics } from './getServicesStatistics';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { isRunningMs } from '../../../../server/lib/isRunningMs';
import { getControl } from '../../../../server/lib/migrations';
import { getSettingsStatistics } from '../../../../server/lib/statistics/getSettingsStatistics';
import { getMatrixFederationStatistics } from '../../../../server/services/federation/infrastructure/rocket-chat/adapters/Statistics';
import { getStatistics as federationGetStatistics } from '../../../federation/server/functions/dashboard';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/rocketchat.info';
import { getMongoInfo } from '../../../utils/server/functions/getMongoInfo';

const getUserLanguages = async (totalUsers: number): Promise<{ [key: string]: number }> => {
	const result = await Users.getUserLanguages();

	const languages: { [key: string]: number } = {
		none: totalUsers,
	};

	result.forEach(({ _id, total }: { _id: string; total: number }) => {
		if (!_id) {
			return;
		}
		languages[_id] = total;
		languages.none -= total;
	});

	return languages;
};

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

export const statistics = {
	get: async (): Promise<IStats> => {
		const readPreference = readSecondaryPreferred(db);

		const statistics = {} as IStats;
		const statsPms = [];

		// Setup Wizard
		const [organizationType, industry, size, country, language, serverType, registerServer] = await Promise.all([
			settings.get<string>('Organization_Type'),
			settings.get<string>('Industry'),
			settings.get<string>('Size'),
			settings.get<string>('Country'),
			settings.get<string>('Language'),
			settings.get<string>('Server_Type'),
			settings.get<boolean>('Register_Server'),
		]);

		statistics.wizard = {
			organizationType,
			industry,
			size,
			country,
			language,
			serverType,
			registerServer,
		};

		// Version
		const uniqueID = await Settings.findOne<Pick<ISetting, 'createdAt'>>('uniqueID', { projection: { createdAt: 1 } });
		statistics.uniqueId = settings.get('uniqueID');
		if (uniqueID) {
			statistics.installedAt = uniqueID.createdAt.toISOString();
		}

		statistics.deploymentFingerprintHash = settings.get('Deployment_FingerPrint_Hash');
		statistics.deploymentFingerprintVerified = settings.get('Deployment_FingerPrint_Verified');

		if (Info) {
			statistics.version = Info.version;
			statistics.tag = Info.tag;
			statistics.branch = Info.branch;
		}

		// User statistics
		statistics.totalUsers = await Users.estimatedDocumentCount();
		statistics.activeUsers = await Users.getActiveLocalUserCount();
		statistics.activeGuests = await Users.getActiveLocalGuestCount();
		statistics.nonActiveUsers = await Users.countDocuments({ active: false });
		statistics.appUsers = await Users.countDocuments({ type: 'app' });
		statistics.onlineUsers = await Users.countDocuments({ status: UserStatus.ONLINE });
		statistics.awayUsers = await Users.countDocuments({ status: UserStatus.AWAY });
		statistics.busyUsers = await Users.countDocuments({ status: UserStatus.BUSY });
		statistics.totalConnectedUsers = statistics.onlineUsers + statistics.awayUsers;
		statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers - statistics.busyUsers;
		statsPms.push(
			getUserLanguages(statistics.totalUsers).then((total) => {
				statistics.userLanguages = total;
			}),
		);

		// Room statistics
		statistics.totalRooms = await Rooms.estimatedDocumentCount();
		statistics.totalChannels = await Rooms.countByType('c');
		statistics.totalPrivateGroups = await Rooms.countByType('p');
		statistics.totalDirect = await Rooms.countByType('d');
		statistics.totalLivechat = await Rooms.countByType('l');
		statistics.totalDiscussions = await Rooms.countDiscussions();
		statistics.totalThreads = await Messages.countThreads();

		// livechat visitors
		statistics.totalLivechatVisitors = await LivechatVisitors.estimatedDocumentCount();

		// livechat agents
		statistics.totalLivechatAgents = await Users.countAgents();
		statistics.totalLivechatManagers = await Users.countDocuments({ roles: 'livechat-manager' });

		// livechat enabled
		statistics.livechatEnabled = settings.get('Livechat_enabled');

		// Count and types of omnichannel rooms
		statsPms.push(
			Rooms.allRoomSourcesCount()
				.toArray()
				.then((roomSources) => {
					statistics.omnichannelSources = roomSources.map(({ _id: { id, alias, type }, count }) => ({
						id,
						alias,
						type,
						count,
					}));
				}),
		);

		// Number of livechat rooms with department
		statsPms.push(
			LivechatRooms.countLivechatRoomsWithDepartment().then((count) => {
				statistics.totalLivechatRoomsWithDepartment = count;
			}),
		);

		// Number of departments
		statsPms.push(
			LivechatDepartment.estimatedDocumentCount().then((count) => {
				statistics.departments = count;
			}),
		);

		// Number of archived departments
		statsPms.push(
			LivechatDepartment.countArchived().then((count) => {
				statistics.archivedDepartments = count;
			}),
		);

		// Workspace allows dpeartment removal
		statistics.isDepartmentRemovalEnabled = settings.get('Omnichannel_enable_department_removal');

		// Number of triggers
		statsPms.push(
			LivechatTrigger.estimatedDocumentCount().then((count) => {
				statistics.totalTriggers = count;
			}),
		);

		// Number of custom fields
		statsPms.push((statistics.totalCustomFields = await LivechatCustomField.estimatedDocumentCount()));

		// Number of public custom fields
		statsPms.push((statistics.totalLivechatPublicCustomFields = await LivechatCustomField.countDocuments({ public: true })));

		// Livechat Automatic forwarding feature enabled
		statistics.livechatAutomaticForwardingUnansweredChats = settings.get<number>('Livechat_auto_transfer_chat_timeout') !== 0;

		// Type of routing algorithm used on omnichannel
		statistics.routingAlgorithm = settings.get('Livechat_Routing_Method') || '';

		// is on-hold active
		statistics.onHoldEnabled = settings.get('Livechat_allow_manual_on_hold');

		// Number of Email Inboxes
		statsPms.push(
			EmailInbox.estimatedDocumentCount().then((count) => {
				statistics.emailInboxes = count;
			}),
		);

		statsPms.push(
			LivechatBusinessHours.estimatedDocumentCount().then((count) => {
				statistics.BusinessHours = {
					// Number of Business Hours
					total: count,
					// Business Hours strategy
					strategy: settings.get('Livechat_enable_business_hours') || '',
				};
			}),
		);

		// Type of routing algorithm used on omnichannel
		statistics.routingAlgorithm = settings.get('Livechat_Routing_Method');

		// is on-hold active
		statistics.onHoldEnabled = settings.get('Livechat_allow_manual_on_hold');

		// Last-Chatted Agent Preferred (enabled/disabled)
		statistics.lastChattedAgentPreferred = settings.get('Livechat_last_chatted_agent_routing');

		// Assign new conversations to the contact manager (enabled/disabled)
		statistics.assignNewConversationsToContactManager = settings.get('Omnichannel_contact_manager_routing');

		// How to handle Visitor Abandonment setting
		statistics.visitorAbandonment = settings.get('Livechat_abandoned_rooms_action');

		// Amount of chats placed on hold
		statsPms.push(
			Messages.countRoomsWithMessageType('omnichannel_placed_chat_on_hold', { readPreference }).then((total) => {
				statistics.chatsOnHold = total;
			}),
		);

		// VoIP Enabled
		statistics.voipEnabled = settings.get('VoIP_Enabled');

		// Amount of VoIP Calls
		statsPms.push(
			Rooms.countByType('v').then((count) => {
				statistics.voipCalls = count;
			}),
		);

		// Amount of VoIP Extensions connected
		statsPms.push(
			Users.countDocuments({ extension: { $exists: true } }).then((count) => {
				statistics.voipExtensions = count;
			}),
		);

		// Amount of Calls that ended properly
		statsPms.push(
			Messages.countByType('voip-call-wrapup', { readPreference }).then((count) => {
				statistics.voipSuccessfulCalls = count;
			}),
		);

		// Amount of Calls that ended with an error
		statsPms.push(
			Messages.countByType('voip-call-ended-unexpectedly', { readPreference }).then((count) => {
				statistics.voipErrorCalls = count;
			}),
		);
		// Amount of Calls that were put on hold
		statsPms.push(
			Messages.countRoomsWithMessageType('voip-call-on-hold', { readPreference }).then((count) => {
				statistics.voipOnHoldCalls = count;
			}),
		);

		const defaultValue = { contactsCount: 0, conversationsCount: 0, sources: [] };
		const billablePeriod = moment.utc().format('YYYY-MM');
		statsPms.push(
			LivechatRooms.getMACStatisticsForPeriod(billablePeriod).then(([result]) => {
				statistics.omnichannelContactsBySource = result || defaultValue;
			}),
		);

		const monthAgo = moment.utc().subtract(30, 'days').toDate();
		const today = moment.utc().toDate();
		statsPms.push(
			LivechatRooms.getMACStatisticsBetweenDates(monthAgo, today).then(([result]) => {
				statistics.uniqueContactsOfLastMonth = result || defaultValue;
			}),
		);

		const weekAgo = moment.utc().subtract(7, 'days').toDate();
		statsPms.push(
			LivechatRooms.getMACStatisticsBetweenDates(weekAgo, today).then(([result]) => {
				statistics.uniqueContactsOfLastWeek = result || defaultValue;
			}),
		);

		const yesterday = moment.utc().subtract(1, 'days').toDate();
		statsPms.push(
			LivechatRooms.getMACStatisticsBetweenDates(yesterday, today).then(([result]) => {
				statistics.uniqueContactsOfYesterday = result || defaultValue;
			}),
		);

		// Message statistics
		const channels = await Rooms.findByType('c', { projection: { msgs: 1, prid: 1 } }).toArray();
		const totalChannelDiscussionsMessages = channels.reduce(function _countChannelDiscussionsMessages(num: number, room: IRoom) {
			return num + (room.prid ? room.msgs : 0);
		}, 0);
		statistics.totalChannelMessages =
			channels.reduce(function _countChannelMessages(num: number, room: IRoom) {
				return num + room.msgs;
			}, 0) - totalChannelDiscussionsMessages;

		const privateGroups = await Rooms.findByType('p', { projection: { msgs: 1, prid: 1 } }).toArray();
		const totalPrivateGroupsDiscussionsMessages = privateGroups.reduce(function _countPrivateGroupsDiscussionsMessages(
			num: number,
			room: IRoom,
		) {
			return num + (room.prid ? room.msgs : 0);
		}, 0);
		statistics.totalPrivateGroupMessages =
			privateGroups.reduce(function _countPrivateGroupMessages(num: number, room: IRoom) {
				return num + room.msgs;
			}, 0) - totalPrivateGroupsDiscussionsMessages;

		statistics.totalDiscussionsMessages = totalPrivateGroupsDiscussionsMessages + totalChannelDiscussionsMessages;

		statistics.totalDirectMessages = (await Rooms.findByType('d', { projection: { msgs: 1 } }).toArray()).reduce(
			function _countDirectMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalLivechatMessages = (await Rooms.findByType('l', { projection: { msgs: 1 } }).toArray()).reduce(
			function _countLivechatMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalMessages =
			statistics.totalChannelMessages +
			statistics.totalPrivateGroupMessages +
			statistics.totalDiscussionsMessages +
			statistics.totalDirectMessages +
			statistics.totalLivechatMessages;

		// Federation statistics
		statsPms.push(
			federationGetStatistics().then((federationOverviewData) => {
				statistics.federatedServers = federationOverviewData.numberOfServers;
				statistics.federatedUsers = federationOverviewData.numberOfFederatedUsers;
			}),
		);

		statistics.lastLogin = (await Users.getLastLogin())?.toString() || '';
		statistics.lastMessageSentAt = await Messages.getLastTimestamp();
		statistics.lastSeenSubscription = (await Subscriptions.getLastSeen())?.toString() || '';

		statistics.os = {
			type: os.type(),
			platform: os.platform(),
			arch: os.arch(),
			release: os.release(),
			uptime: os.uptime(),
			loadavg: os.loadavg(),
			totalmem: os.totalmem(),
			freemem: os.freemem(),
			cpus: os.cpus(),
		};

		statistics.process = {
			nodeVersion: process.version,
			pid: process.pid,
			uptime: process.uptime(),
		};

		statistics.deploy = {
			method: process.env.DEPLOY_METHOD || 'tar',
			platform: process.env.DEPLOY_PLATFORM || 'selfinstall',
		};

		statistics.readReceiptsEnabled = settings.get('Message_Read_Receipt_Enabled');
		statistics.readReceiptsDetailed = settings.get('Message_Read_Receipt_Store_Users');

		statistics.enterpriseReady = true;
		statsPms.push(
			Uploads.estimatedDocumentCount().then((count) => {
				statistics.uploadsTotal = count;
			}),
		);
		statsPms.push(
			Uploads.col
				.aggregate(
					[
						{
							$group: { _id: 'total', total: { $sum: '$size' } },
						},
					],
					{ readPreference },
				)
				.toArray()
				.then((agg) => {
					const [result] = agg;
					statistics.uploadsTotalSize = result ? (result as any).total : 0;
				}),
		);

		statistics.migration = await getControl();
		statsPms.push(
			InstanceStatus.countDocuments({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } }).then((count) => {
				statistics.instanceCount = count;
			}),
		);

		const { oplogEnabled, mongoVersion, mongoStorageEngine } = await getMongoInfo();
		statistics.msEnabled = isRunningMs();
		statistics.oplogEnabled = oplogEnabled;
		statistics.mongoVersion = mongoVersion;
		statistics.mongoStorageEngine = mongoStorageEngine || '';

		statsPms.push(
			Sessions.getUniqueUsersOfYesterday().then((result) => {
				statistics.uniqueUsersOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueUsersOfLastWeek().then((result) => {
				statistics.uniqueUsersOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueUsersOfLastMonth().then((result) => {
				statistics.uniqueUsersOfLastMonth = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfYesterday().then((result) => {
				statistics.uniqueDevicesOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfLastWeek().then((result) => {
				statistics.uniqueDevicesOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueDevicesOfLastMonth().then((result) => {
				statistics.uniqueDevicesOfLastMonth = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfYesterday().then((result) => {
				statistics.uniqueOSOfYesterday = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfLastWeek().then((result) => {
				statistics.uniqueOSOfLastWeek = result;
			}),
		);
		statsPms.push(
			Sessions.getUniqueOSOfLastMonth().then((result) => {
				statistics.uniqueOSOfLastMonth = result;
			}),
		);

		statistics.apps = await getAppsStatistics();
		statistics.services = await getServicesStatistics();
		statistics.importer = getImporterStatistics();
		statistics.videoConf = await VideoConf.getStatistics();
		statistics.contactVerification = await getContactVerificationStatistics();

		// If getSettingsStatistics() returns an error, save as empty object.
		statsPms.push(
			getSettingsStatistics().then((res) => {
				const settingsStatisticsObject = res || {};
				statistics.settings = settingsStatisticsObject;
			}),
		);

		statsPms.push(
			Integrations.find(
				{},
				{
					projection: {
						_id: 0,
						type: 1,
						enabled: 1,
						scriptEnabled: 1,
					},
					readPreference,
				},
			)
				.toArray()
				.then((found) => {
					const integrations = found;

					statistics.integrations = {
						totalIntegrations: integrations.length,
						totalIncoming: integrations.filter((integration) => integration.type === 'webhook-incoming').length,
						totalIncomingActive: integrations.filter(
							(integration) => integration.enabled === true && integration.type === 'webhook-incoming',
						).length,
						totalOutgoing: integrations.filter((integration) => integration.type === 'webhook-outgoing').length,
						totalOutgoingActive: integrations.filter(
							(integration) => integration.enabled === true && integration.type === 'webhook-outgoing',
						).length,
						totalWithScriptEnabled: integrations.filter((integration) => integration.scriptEnabled === true).length,
					};
				}),
		);

		statsPms.push(
			NotificationQueue.estimatedDocumentCount().then((count) => {
				statistics.pushQueue = count;
			}),
		);

		statsPms.push(
			getEnterpriseStatistics().then((result) => {
				statistics.enterprise = result;
			}),
		);

		statsPms.push(
			Team.getStatistics().then((result) => {
				statistics.teams = result;
			}),
		);

		statsPms.push(Analytics.resetSeatRequestCount());

		// TODO: Is that the best way to do this? maybe we should use a promise.all()

		statistics.dashboardCount = settings.get('Engagement_Dashboard_Load_Count');
		statistics.messageAuditApply = settings.get('Message_Auditing_Apply_Count');
		statistics.messageAuditLoad = settings.get('Message_Auditing_Panel_Load_Count');
		statistics.joinJitsiButton = settings.get('Jitsi_Click_To_Join_Count');
		statistics.slashCommandsJitsi = settings.get('Jitsi_Start_SlashCommands_Count');
		statistics.totalOTRRooms = await Rooms.countByCreatedOTR({ readPreference });
		statistics.totalOTR = settings.get('OTR_Count');
		statistics.totalBroadcastRooms = await Rooms.countByBroadcast({ readPreference });
		statistics.totalTriggeredEmails = settings.get('Triggered_Emails_Count');
		statistics.totalRoomsWithStarred = await Messages.countRoomsWithStarredMessages({ readPreference });
		statistics.totalRoomsWithPinned = await Messages.countRoomsWithPinnedMessages({ readPreference });
		statistics.totalUserTOTP = await Users.countActiveUsersTOTPEnable({ readPreference });
		statistics.totalUserEmail2fa = await Users.countActiveUsersEmail2faEnable({ readPreference });
		statistics.totalPinned = await Messages.countPinned({ readPreference });
		statistics.totalStarred = await Messages.countStarred({ readPreference });
		statistics.totalLinkInvitation = await Invites.estimatedDocumentCount();
		statistics.totalLinkInvitationUses = await Invites.countUses();
		statistics.totalEmailInvitation = settings.get('Invitation_Email_Count');
		statistics.totalE2ERooms = await Rooms.countByE2E({ readPreference });
		statistics.logoChange = Object.keys(settings.get('Assets_logo') || {}).includes('url');
		statistics.showHomeButton = settings.get('Layout_Show_Home_Button');
		statistics.totalEncryptedMessages = await Messages.countByType('e2e', { readPreference });
		statistics.totalManuallyAddedUsers = settings.get('Manual_Entry_User_Count');
		statistics.totalSubscriptionRoles = await RolesRaw.countByScope('Subscriptions', { readPreference });
		statistics.totalUserRoles = await RolesRaw.countByScope('Users', { readPreference });
		statistics.totalCustomRoles = await RolesRaw.countCustomRoles({ readPreference });
		statistics.totalWebRTCCalls = settings.get('WebRTC_Calls_Count');
		statistics.uncaughtExceptionsCount = settings.get('Uncaught_Exceptions_Count');

		const defaultGateway = (await Settings.findOneById('Push_gateway', { projection: { packageValue: 1 } }))?.packageValue;

		// Push notification stats
		// one bit for each of the following:
		const pushEnabled = settings.get('Push_enable') ? 1 : 0;
		const pushGatewayEnabled = settings.get('Push_enable_gateway') ? 2 : 0;
		const pushGatewayChanged = settings.get('Push_gateway') !== defaultGateway ? 4 : 0;

		statistics.push = pushEnabled | pushGatewayEnabled | pushGatewayChanged;
		statistics.pushSecured = settings.get<boolean>('Push_request_content_from_server');

		const defaultHomeTitle = (await Settings.findOneById('Layout_Home_Title'))?.packageValue;
		statistics.homeTitleChanged = settings.get('Layout_Home_Title') !== defaultHomeTitle;

		const defaultHomeBody = (await Settings.findOneById('Layout_Home_Body'))?.packageValue;
		statistics.homeBodyChanged = settings.get('Layout_Home_Body') !== defaultHomeBody;

		const defaultCustomCSS = (await Settings.findOneById('theme-custom-css'))?.packageValue;
		statistics.customCSSChanged = settings.get('theme-custom-css') !== defaultCustomCSS;

		const defaultOnLogoutCustomScript = (await Settings.findOneById('Custom_Script_On_Logout'))?.packageValue;
		statistics.onLogoutCustomScriptChanged = settings.get('Custom_Script_On_Logout') !== defaultOnLogoutCustomScript;

		const defaultLoggedOutCustomScript = (await Settings.findOneById('Custom_Script_Logged_Out'))?.packageValue;
		statistics.loggedOutCustomScriptChanged = settings.get('Custom_Script_Logged_Out') !== defaultLoggedOutCustomScript;

		const defaultLoggedInCustomScript = (await Settings.findOneById('Custom_Script_Logged_In'))?.packageValue;
		statistics.loggedInCustomScriptChanged = settings.get('Custom_Script_Logged_In') !== defaultLoggedInCustomScript;

		try {
			statistics.dailyPeakConnections = await Presence.getPeakConnections(true);
		} catch {
			statistics.dailyPeakConnections = 0;
		}

		const peak = await Statistics.findMonthlyPeakConnections();
		statistics.maxMonthlyPeakConnections = Math.max(statistics.dailyPeakConnections, peak?.dailyPeakConnections || 0);

		statistics.matrixFederation = await getMatrixFederationStatistics();

		// Omnichannel call stats
		statistics.webRTCEnabled = settings.get('WebRTC_Enabled');
		statistics.webRTCEnabledForOmnichannel = settings.get('Omnichannel_call_provider') === 'WebRTC';
		statistics.omnichannelWebRTCCalls = await Rooms.findCountOfRoomsWithActiveCalls();

		await Promise.all(statsPms).catch(log);

		return statistics;
	},
	async save(): Promise<IStats> {
		const rcStatistics = await statistics.get();
		rcStatistics.createdAt = new Date();
		const { insertedId } = await Statistics.insertOne(rcStatistics);
		rcStatistics._id = insertedId;

		return rcStatistics;
	},
};
