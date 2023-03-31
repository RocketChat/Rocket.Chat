import os from 'os';
import { log } from 'console';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import type { IRoom, IStats } from '@rocket.chat/core-typings';
import {
	NotificationQueue,
	Users as UsersRaw,
	Rooms as RoomsRaw,
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
} from '@rocket.chat/models';
import { Analytics, Team, VideoConf } from '@rocket.chat/core-services';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Info, getMongoInfo } from '../../../utils/server';
import { getControl } from '../../../../server/lib/migrations';
import { getStatistics as federationGetStatistics } from '../../../federation/server/functions/dashboard';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { getAppsStatistics } from './getAppsStatistics';
import { getImporterStatistics } from './getImporterStatistics';
import { getServicesStatistics } from './getServicesStatistics';
import { getStatistics as getEnterpriseStatistics } from '../../../../ee/app/license/server';
import { getSettingsStatistics } from '../../../../server/lib/statistics/getSettingsStatistics';
import { isRunningMs } from '../../../../server/lib/isRunningMs';
import { getMatrixFederationStatistics } from '../../../../server/services/federation/infrastructure/rocket-chat/adapters/statistics';

const wizardFields = ['Organization_Type', 'Industry', 'Size', 'Country', 'Language', 'Server_Type', 'Register_Server'];

const getUserLanguages = async (totalUsers: number): Promise<{ [key: string]: number }> => {
	const result = await UsersRaw.getUserLanguages();

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
		statistics.wizard = {};
		await Promise.all(
			wizardFields.map(async (field) => {
				const record = await Settings.findOne(field);
				if (record) {
					const wizardField = field.replace(/_/g, '').replace(field[0], field[0].toLowerCase());
					statistics.wizard[wizardField] = record.value;
				}
			}),
		);

		// Version
		const uniqueID = await Settings.findOne('uniqueID');
		statistics.uniqueId = settings.get('uniqueID');
		if (uniqueID) {
			statistics.installedAt = uniqueID.createdAt.toISOString();
		}

		if (Info) {
			statistics.version = Info.version;
			statistics.tag = Info.tag;
			statistics.branch = Info.branch;
		}

		// User statistics
		statistics.totalUsers = Users.find().count();
		statistics.activeUsers = Users.getActiveLocalUserCount();
		statistics.activeGuests = Users.getActiveLocalGuestCount();
		statistics.nonActiveUsers = Users.find({ active: false }).count();
		statistics.appUsers = Users.find({ type: 'app' }).count();
		statistics.onlineUsers = Meteor.users.find({ status: 'online' }).count();
		statistics.awayUsers = Meteor.users.find({ status: 'away' }).count();
		statistics.busyUsers = Meteor.users.find({ status: 'busy' }).count();
		statistics.totalConnectedUsers = statistics.onlineUsers + statistics.awayUsers;
		statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers - statistics.busyUsers;
		statsPms.push(
			getUserLanguages(statistics.totalUsers).then((total) => {
				statistics.userLanguages = total;
			}),
		);

		// Room statistics
		statistics.totalRooms = await RoomsRaw.col.countDocuments({});
		statistics.totalChannels = await RoomsRaw.findByType('c').count();
		statistics.totalPrivateGroups = await RoomsRaw.findByType('p').count();
		statistics.totalDirect = await RoomsRaw.findByType('d').count();
		statistics.totalLivechat = await RoomsRaw.findByType('l').count();
		statistics.totalDiscussions = await RoomsRaw.countDiscussions();
		statistics.totalThreads = await Messages.countThreads();

		// livechat visitors
		statistics.totalLivechatVisitors = await LivechatVisitors.col.estimatedDocumentCount();

		// livechat agents
		statistics.totalLivechatAgents = Users.findAgents().count();
		statistics.totalLivechatManagers = await UsersRaw.col.countDocuments({ roles: 'livechat-manager' });

		// livechat enabled
		statistics.livechatEnabled = settings.get('Livechat_enabled');

		// Count and types of omnichannel rooms
		statsPms.push(
			RoomsRaw.allRoomSourcesCount()
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

		// Number of departments
		statsPms.push(
			LivechatDepartment.col.count().then((count) => {
				statistics.departments = count;
			}),
		);

		// Number of archived departments
		statsPms.push(
			LivechatDepartment.col.countDocuments({ archived: true }).then((count) => {
				statistics.archivedDepartments = count;
			}),
		);

		// Workspace allows dpeartment removal
		statistics.isDepartmentRemovalEnabled = settings.get('Omnichannel_enable_department_removal');

		// Number of triggers
		statsPms.push(
			LivechatTrigger.col.count().then((count) => {
				statistics.totalTriggers = count;
			}),
		);

		// Number of custom fields
		statsPms.push(
			LivechatCustomField.col.count().then((count) => {
				statistics.totalCustomFields = count;
			}),
		);

		// Type of routing algorithm used on omnichannel
		statistics.routingAlgorithm = settings.get('Livechat_Routing_Method') || '';

		// is on-hold active
		statistics.onHoldEnabled = settings.get('Livechat_allow_manual_on_hold');

		// Number of Email Inboxes
		statsPms.push(
			EmailInbox.col.count().then((count) => {
				statistics.emailInboxes = count;
			}),
		);

		statsPms.push(
			LivechatBusinessHours.col.count().then((count) => {
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
			RoomsRaw.countByType('v').then((count) => {
				statistics.voipCalls = count;
			}),
		);

		// Amount of VoIP Extensions connected
		statsPms.push(
			UsersRaw.col.countDocuments({ extension: { $exists: true } }).then((count) => {
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

		// Message statistics
		statistics.totalChannelMessages = _.reduce(
			await RoomsRaw.findByType('c', { projection: { msgs: 1 } }).toArray(),
			function _countChannelMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalPrivateGroupMessages = _.reduce(
			await RoomsRaw.findByType('p', { projection: { msgs: 1 } }).toArray(),
			function _countPrivateGroupMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalDirectMessages = _.reduce(
			await RoomsRaw.findByType('d', { projection: { msgs: 1 } }).toArray(),
			function _countDirectMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalLivechatMessages = _.reduce(
			await RoomsRaw.findByType('l', { projection: { msgs: 1 } }).toArray(),
			function _countLivechatMessages(num: number, room: IRoom) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalMessages =
			statistics.totalChannelMessages +
			statistics.totalPrivateGroupMessages +
			statistics.totalDirectMessages +
			statistics.totalLivechatMessages;

		// Federation statistics
		statsPms.push(
			federationGetStatistics().then((federationOverviewData) => {
				statistics.federatedServers = federationOverviewData.numberOfServers;
				statistics.federatedUsers = federationOverviewData.numberOfFederatedUsers;
			}),
		);

		statistics.lastLogin = Users.getLastLogin();
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
			Uploads.col.estimatedDocumentCount().then((count) => {
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

		statistics.migration = getControl();
		statsPms.push(
			InstanceStatus.col.countDocuments({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } }).then((count) => {
				statistics.instanceCount = count;
			}),
		);

		const { oplogEnabled, mongoVersion, mongoStorageEngine } = await getMongoInfo();
		statistics.msEnabled = isRunningMs();
		statistics.oplogEnabled = oplogEnabled;
		statistics.mongoVersion = mongoVersion;
		statistics.mongoStorageEngine = mongoStorageEngine;

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

		statistics.apps = getAppsStatistics();
		statistics.services = getServicesStatistics();
		statistics.importer = getImporterStatistics();
		statistics.videoConf = await VideoConf.getStatistics();

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
			NotificationQueue.col.estimatedDocumentCount().then((count) => {
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
		statistics.totalOTRRooms = await RoomsRaw.findByCreatedOTR().count();
		statistics.totalOTR = settings.get('OTR_Count');
		statistics.totalBroadcastRooms = await RoomsRaw.findByBroadcast().count();
		statistics.totalRoomsWithActiveLivestream = await RoomsRaw.findByActiveLivestream().count();
		statistics.totalTriggeredEmails = settings.get('Triggered_Emails_Count');
		statistics.totalRoomsWithStarred = await Messages.countRoomsWithStarredMessages({ readPreference });
		statistics.totalRoomsWithPinned = await Messages.countRoomsWithPinnedMessages({ readPreference });
		statistics.totalUserTOTP = await UsersRaw.findActiveUsersTOTPEnable({ readPreference }).count();
		statistics.totalUserEmail2fa = await UsersRaw.findActiveUsersEmail2faEnable({ readPreference }).count();
		statistics.totalPinned = await Messages.findPinned({ readPreference }).count();
		statistics.totalStarred = await Messages.findStarred({ readPreference }).count();
		statistics.totalLinkInvitation = await Invites.find().count();
		statistics.totalLinkInvitationUses = await Invites.countUses();
		statistics.totalEmailInvitation = settings.get('Invitation_Email_Count');
		statistics.totalE2ERooms = await RoomsRaw.findByE2E({ readPreference }).count();
		statistics.logoChange = Object.keys(settings.get('Assets_logo')).includes('url');
		statistics.showHomeButton = settings.get('Layout_Show_Home_Button');
		statistics.totalEncryptedMessages = await Messages.countByType('e2e', { readPreference });
		statistics.totalManuallyAddedUsers = settings.get('Manual_Entry_User_Count');
		statistics.totalSubscriptionRoles = await RolesRaw.findByScope('Subscriptions').count();
		statistics.totalUserRoles = await RolesRaw.findByScope('Users').count();
		statistics.totalCustomRoles = await RolesRaw.findCustomRoles({ readPreference }).count();
		statistics.totalWebRTCCalls = settings.get('WebRTC_Calls_Count');
		statistics.uncaughtExceptionsCount = settings.get('Uncaught_Exceptions_Count');

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

		statistics.matrixFederation = await getMatrixFederationStatistics();

		// Omnichannel call stats
		statistics.webRTCEnabled = settings.get('WebRTC_Enabled');
		statistics.webRTCEnabledForOmnichannel = settings.get('Omnichannel_call_provider') === 'WebRTC';
		statistics.omnichannelWebRTCCalls = await RoomsRaw.findCountOfRoomsWithActiveCalls();

		await Promise.all(statsPms).catch(log);

		return statistics;
	},
	async save(): Promise<IStats> {
		const rcStatistics = await statistics.get();
		rcStatistics.createdAt = new Date();
		await Statistics.insertOne(rcStatistics);
		return rcStatistics;
	},
};
