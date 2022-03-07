import os from 'os';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { MongoInternals } from 'meteor/mongo';

import { Settings, Users, Rooms, Subscriptions, Messages, LivechatVisitors } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Info, getMongoInfo } from '../../../utils/server';
import { getControl } from '../../../../server/lib/migrations';
import { getStatistics as federationGetStatistics } from '../../../federation/server/functions/dashboard';
import {
	NotificationQueue,
	Users as UsersRaw,
	Rooms as RoomsRaw,
	Statistics,
	Sessions,
	Integrations,
	Uploads,
	Invites,
} from '../../../models/server/raw';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { getAppsStatistics } from './getAppsStatistics';
import { getServicesStatistics } from './getServicesStatistics';
import { getStatistics as getEnterpriseStatistics } from '../../../../ee/app/license/server';
import { Team, Analytics } from '../../../../server/sdk';
import { getSettingsStatistics } from '../../../../server/lib/statistics/getSettingsStatistics';
// import { USER_ORIGIN } from '../../../../definition/IUser';

const wizardFields = ['Organization_Type', 'Industry', 'Size', 'Country', 'Language', 'Server_Type', 'Register_Server'];

const getUserLanguages = async (totalUsers) => {
	const result = await UsersRaw.getUserLanguages();

	const languages = {
		none: totalUsers,
	};

	result.forEach(({ _id, total }) => {
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
	get: async () => {
		const readPreference = readSecondaryPreferred(db);

		const statistics = {};

		// Setup Wizard
		statistics.wizard = {};
		wizardFields.forEach((field) => {
			const record = Settings.findOne(field);
			if (record) {
				const wizardField = field.replace(/_/g, '').replace(field[0], field[0].toLowerCase());
				statistics.wizard[wizardField] = record.value;
			}
		});

		// Version
		statistics.uniqueId = settings.get('uniqueID');
		if (Settings.findOne('uniqueID')) {
			statistics.installedAt = Settings.findOne('uniqueID').createdAt;
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
		statistics.userLanguages = await getUserLanguages(statistics.totalUsers);

		// Room statistics
		statistics.totalRooms = Rooms.find().count();
		statistics.totalChannels = Rooms.findByType('c').count();
		statistics.totalPrivateGroups = Rooms.findByType('p').count();
		statistics.totalDirect = Rooms.findByType('d').count();
		statistics.totalLivechat = Rooms.findByType('l').count();
		statistics.totalDiscussions = Rooms.countDiscussions();
		statistics.totalThreads = Messages.countThreads();

		// Teams statistics
		statistics.teams = await Team.getStatistics();

		statistics.totalTeams = statistics.teams.totalTeams;

		statistics.totalChannelInTeams = _.reduce(
			statistics.teams.teamStats,
			function (num, team) {
				return num + team.totalRooms;
			},
			0,
		);

		statistics.totalAutoJoinChannelInTeams = _.reduce(
			statistics.teams.teamStats,
			function (num, team) {
				return num + team.totalDefaultRooms;
			},
			0,
		);

		// livechat visitors
		statistics.totalLivechatVisitors = LivechatVisitors.find().count();

		// livechat agents
		statistics.totalLivechatAgents = Users.findAgents().count();

		// livechat enabled
		statistics.livechatEnabled = settings.get('Livechat_enabled');

		// Count and types of omnichannel rooms
		statistics.omnichannelSources = (await RoomsRaw.allRoomSourcesCount().toArray()).map(({ _id: { id, alias, type }, count }) => ({
			id,
			alias,
			type,
			count,
		}));

		// Message statistics
		statistics.totalChannelMessages = _.reduce(
			Rooms.findByType('c', { fields: { msgs: 1 } }).fetch(),
			function _countChannelMessages(num, room) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalPrivateGroupMessages = _.reduce(
			Rooms.findByType('p', { fields: { msgs: 1 } }).fetch(),
			function _countPrivateGroupMessages(num, room) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalDirectMessages = _.reduce(
			Rooms.findByType('d', { fields: { msgs: 1 } }).fetch(),
			function _countDirectMessages(num, room) {
				return num + room.msgs;
			},
			0,
		);
		statistics.totalLivechatMessages = _.reduce(
			Rooms.findByType('l', { fields: { msgs: 1 } }).fetch(),
			function _countLivechatMessages(num, room) {
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
		const federationOverviewData = federationGetStatistics();

		statistics.federatedServers = federationOverviewData.numberOfServers;
		statistics.federatedUsers = federationOverviewData.numberOfFederatedUsers;

		statistics.lastLogin = Users.getLastLogin();
		statistics.lastMessageSentAt = Messages.getLastTimestamp();
		statistics.lastSeenSubscription = Subscriptions.getLastSeen();

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

		statistics.uploadsTotal = await Uploads.find().count();
		const [result] = await Uploads.col
			.aggregate(
				[
					{
						$group: { _id: 'total', total: { $sum: '$size' } },
					},
				],
				{ readPreference },
			)
			.toArray();
		statistics.uploadsTotalSize = result ? result.total : 0;

		statistics.migration = getControl();
		statistics.instanceCount = InstanceStatus.getCollection()
			.find({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } })
			.count();

		const { oplogEnabled, mongoVersion, mongoStorageEngine } = getMongoInfo();
		statistics.oplogEnabled = oplogEnabled;
		statistics.mongoVersion = mongoVersion;
		statistics.mongoStorageEngine = mongoStorageEngine;

		statistics.uniqueUsersOfYesterday = await Sessions.getUniqueUsersOfYesterday();
		statistics.uniqueUsersOfLastWeek = await Sessions.getUniqueUsersOfLastWeek();
		statistics.uniqueUsersOfLastMonth = await Sessions.getUniqueUsersOfLastMonth();
		statistics.uniqueDevicesOfYesterday = await Sessions.getUniqueDevicesOfYesterday();
		statistics.uniqueDevicesOfLastWeek = await Sessions.getUniqueDevicesOfLastWeek();
		statistics.uniqueDevicesOfLastMonth = await Sessions.getUniqueDevicesOfLastMonth();
		statistics.uniqueOSOfYesterday = await Sessions.getUniqueOSOfYesterday();
		statistics.uniqueOSOfLastWeek = await Sessions.getUniqueOSOfLastWeek();
		statistics.uniqueOSOfLastMonth = await Sessions.getUniqueOSOfLastMonth();

		statistics.apps = getAppsStatistics();
		statistics.services = getServicesStatistics();

		// If getSettingsStatistics() returns an error, save as empty object.
		const settingsStatisticsObject = (await getSettingsStatistics()) || {};
		statistics.settings = settingsStatisticsObject;

		const integrations = await Integrations.find(
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
		).toArray();

		statistics.integrations = {
			totalIntegrations: integrations.length,
			totalIncoming: integrations.filter((integration) => integration.type === 'webhook-incoming').length,
			totalIncomingActive: integrations.filter((integration) => integration.enabled === true && integration.type === 'webhook-incoming')
				.length,
			totalOutgoing: integrations.filter((integration) => integration.type === 'webhook-outgoing').length,
			totalOutgoingActive: integrations.filter((integration) => integration.enabled === true && integration.type === 'webhook-outgoing')
				.length,
			totalWithScriptEnabled: integrations.filter((integration) => integration.scriptEnabled === true).length,
		};

		statistics.pushQueue = await NotificationQueue.col.estimatedDocumentCount();

		statistics.enterprise = getEnterpriseStatistics();
		await Analytics.resetSeatRequestCount();

		statistics.totalRoomsWithSnippet = _.reduce(
			Rooms.find({}).fetch(),
			function _roomsWithSnippet(num, room) {
				const { _id } = room;
				const snippetMessages = Messages.findSnippetedByRoom(_id).count();
				if (snippetMessages > 0) {
					return num + 1;
				}
				return num;
			},
			0,
		);

		statistics.totalRoomsWithStarred = _.reduce(
			Rooms.find({}).fetch(),
			function _roomsWithPinned(num, room) {
				const { _id } = room;
				const starredMessages = Messages.findStarredByRoom(_id).count();
				if (starredMessages > 0) {
					return num + 1;
				}
				return num;
			},
			0,
		);

		statistics.totalRoomsWithPinned = _.reduce(
			Rooms.find({}).fetch(),
			function _roomsWithPinned(num, room) {
				const { _id } = room;
				const pinnedMessages = Messages.findPinnedByRoom(_id).count();
				if (pinnedMessages > 0) {
					return num + 1;
				}
				return num;
			},
			0,
		);

		statistics.totalSnippet = Messages.findSnippet().count();
		statistics.totalStarrred = Messages.findStarred().count();
		statistics.totalPinned = Messages.findPinned().count();

		statistics.totalE2ERooms = Rooms.findByE2E().count();
		statistics.totalE2EMessages = _.reduce(
			Rooms.findByE2E().fetch(),
			function _e2eMessages(num, room) {
				const { _id } = room;
				const e2eMessages = Messages.findE2EByRoom(_id).count();
				return num + e2eMessages;
			},
			0,
		);
		statistics.totalOTRDm = Rooms.find({ createdOTR: true }).count();
		statistics.totalOTR = settings.get('OTR_Count');
		statistics.totalEngagementDashboard = settings.get('Engagement_Dashboard_Load_Count');
		statistics.totalAuditApply = settings.get('Message_Auditing_Apply_Count');
		statistics.totalAuditLoad = settings.get('Message_Auditing_Panel_Load_Count');
		statistics.totalJoinJitsiButton = settings.get('Jits_Click_To_Join_Count');
		statistics.totalSlashCommandsJitsi = settings.get('Jitsi_Start_SlashCommands_Count');

		statistics.totalUserTOTP = Users.findActiveUsersTOTPEnable().count();
		statistics.totalUserEmail2fa = Users.findActiveUsersEmail2faEnable().count();

		statistics.showHomeButton = settings.get('Layout_Show_Home_Button');
		statistics.homeTitle = settings.get('Layout_Home_Title');
		statistics.homeBody = settings.get('Layout_Home_Body').split('\n')[0];
		statistics.logoChange = Object.keys(settings.get('Assets_logo')).includes('url');
		statistics.customCSS = settings.get('theme-custom-css').split('\n').length;
		statistics.customScript = _.reduce(
			['Custom_Script_On_Logout', 'Custom_Script_Logged_Out', 'Custom_Script_Logged_In'],
			function _custonScript(num, setting) {
				const script = settings.get(setting);
				if (script !== '//Add your script') {
					return num + script.split('\n').length;
				}
				return num;
			},
			0,
		);

		statistics.tabInvites = await Invites.find().count();
		statistics.totalEmailInvitation = settings.get('Invitation_Email_Count');

		// statistics.usersCreatedADM = await Users.find({ origin: USER_ORIGIN.ADMIN_ADD }).count();
		// statistics.usersCreatedSlackImport = await Users.find({ origin: USER_ORIGIN.SLACK_IMPORT }).count();
		// statistics.usersCreatedSlackUser = await Users.find({ origin: USER_ORIGIN.SLACK_USER_IMPORT }).count();
		// statistics.usersCreatedCSVImport = await Users.find({ origin: USER_ORIGIN.CSV_IMPORT }).count();
		// statistics.usersCreatedHiptext = await Users.find({ origin: USER_ORIGIN.HIPTEXT_IMPORT }).count();

		return statistics;
	},
	async save() {
		const rcStatistics = await statistics.get();
		rcStatistics.createdAt = new Date();
		await Statistics.insertOne(rcStatistics);
		return rcStatistics;
	},
};
