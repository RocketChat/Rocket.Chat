import os from 'os';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import {
	Sessions,
	Settings,
	Users,
	Rooms,
	Subscriptions,
	Uploads,
	Messages,
	LivechatVisitors,
	Integrations,
} from '../../../models/server';
import { settings } from '../../../settings/server';
import { Info, getMongoInfo } from '../../../utils/server';
import { Migrations } from '../../../migrations/server';
import { statistics } from '../statisticsNamespace';
import { Apps } from '../../../apps/server';
import { getStatistics as federationGetStatistics } from '../../../federation/server/methods/dashboard';

const wizardFields = [
	'Organization_Type',
	'Industry',
	'Size',
	'Country',
	'Language',
	'Server_Type',
	'Register_Server',
];

statistics.get = function _getStatistics() {
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
	statistics.totalUsers = Meteor.users.find().count();
	statistics.activeUsers = Meteor.users.find({ active: true }).count();
	statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers;
	statistics.onlineUsers = Meteor.users.find({ statusConnection: 'online' }).count();
	statistics.awayUsers = Meteor.users.find({ statusConnection: 'away' }).count();
	statistics.totalConnectedUsers = statistics.onlineUsers + statistics.awayUsers;
	statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers;

	// Room statistics
	statistics.totalRooms = Rooms.find().count();
	statistics.totalChannels = Rooms.findByType('c').count();
	statistics.totalPrivateGroups = Rooms.findByType('p').count();
	statistics.totalDirect = Rooms.findByType('d').count();
	statistics.totalLivechat = Rooms.findByType('l').count();
	statistics.totalDiscussions = Rooms.countDiscussions();
	statistics.totalThreads = Messages.countThreads();

	// livechat visitors
	statistics.totalLivechatVisitors = LivechatVisitors.find().count();

	// livechat agents
	statistics.totalLivechatAgents = Users.findAgents().count();

	// livechat enabled
	statistics.livechatEnabled = settings.get('Livechat_enabled');

	// Message statistics
	statistics.totalMessages = Messages.find().count();
	statistics.totalChannelMessages = _.reduce(Rooms.findByType('c', { fields: { msgs: 1 } }).fetch(), function _countChannelMessages(num, room) { return num + room.msgs; }, 0);
	statistics.totalPrivateGroupMessages = _.reduce(Rooms.findByType('p', { fields: { msgs: 1 } }).fetch(), function _countPrivateGroupMessages(num, room) { return num + room.msgs; }, 0);
	statistics.totalDirectMessages = _.reduce(Rooms.findByType('d', { fields: { msgs: 1 } }).fetch(), function _countDirectMessages(num, room) { return num + room.msgs; }, 0);
	statistics.totalLivechatMessages = _.reduce(Rooms.findByType('l', { fields: { msgs: 1 } }).fetch(), function _countLivechatMessages(num, room) { return num + room.msgs; }, 0);

	// Federation statistics
	const federationOverviewData = federationGetStatistics();

	statistics.federatedServers = federationOverviewData.numberOfActivePeers + federationOverviewData.numberOfInactivePeers;
	statistics.federatedServersActive = federationOverviewData.numberOfActivePeers;
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

	statistics.uploadsTotal = Uploads.find().count();
	const [result] = Promise.await(Uploads.model.rawCollection().aggregate([{ $group: { _id: 'total', total: { $sum: '$size' } } }]).toArray());
	statistics.uploadsTotalSize = result ? result.total : 0;

	statistics.migration = Migrations._getControl();
	statistics.instanceCount = InstanceStatus.getCollection().find({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } }).count();

	const { oplogEnabled, mongoVersion, mongoStorageEngine } = getMongoInfo();
	statistics.oplogEnabled = oplogEnabled;
	statistics.mongoVersion = mongoVersion;
	statistics.mongoStorageEngine = mongoStorageEngine;

	statistics.uniqueUsersOfYesterday = Sessions.getUniqueUsersOfYesterday();
	statistics.uniqueUsersOfLastMonth = Sessions.getUniqueUsersOfLastMonth();
	statistics.uniqueDevicesOfYesterday = Sessions.getUniqueDevicesOfYesterday();
	statistics.uniqueDevicesOfLastMonth = Sessions.getUniqueDevicesOfLastMonth();
	statistics.uniqueOSOfYesterday = Sessions.getUniqueOSOfYesterday();
	statistics.uniqueOSOfLastMonth = Sessions.getUniqueOSOfLastMonth();

	statistics.apps = {
		engineVersion: Info.marketplaceApiVersion,
		enabled: Apps && Apps.isEnabled(),
		totalInstalled: Apps && Apps.getManager().get().length,
		totalActive: Apps && Apps.getManager().get({ enabled: true }).length,
	};

	const integrations = Integrations.find().fetch();

	statistics.integrations = {
		totalIntegrations: integrations.length,
		totalIncoming: integrations.filter((integration) => integration.type === 'webhook-incoming').length,
		totalIncomingActive: integrations.filter((integration) => integration.enabled === true && integration.type === 'webhook-incoming').length,
		totalOutgoing: integrations.filter((integration) => integration.type === 'webhook-outgoing').length,
		totalOutgoingActive: integrations.filter((integration) => integration.enabled === true && integration.type === 'webhook-outgoing').length,
		totalWithScriptEnabled: integrations.filter((integration) => integration.scriptEnabled === true).length,
	};

	return statistics;
};
