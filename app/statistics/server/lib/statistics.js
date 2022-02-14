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
} from '../../../models/server/raw';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { getAppsStatistics } from './getAppsStatistics';
import { getServicesStatistics } from './getServicesStatistics';
import { getStatistics as getEnterpriseStatistics } from '../../../../ee/app/license/server';
import { Team, Analytics } from '../../../../server/sdk';
import { getSettingsStatistics } from '../../../../server/lib/statistics/getSettingsStatistics';

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

		return statistics;
	},
	async save() {
		const rcStatistics = await statistics.get();
		rcStatistics.createdAt = new Date();
		await Statistics.insertOne(rcStatistics);
		return rcStatistics;
	},
};
