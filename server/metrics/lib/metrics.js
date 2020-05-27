import http from 'http';

import client from 'prom-client';
import connect from 'connect';
import _ from 'underscore';
import gcStats from 'prometheus-gc-stats';
import { Meteor } from 'meteor/meteor';
import { Facts } from 'meteor/facts-base';

import { Info, getOplogInfo } from '../../../app/utils/server';
import { Migrations } from '../../migrations';
import { settings } from '../../../app/settings';
import { Statistics } from '../../../app/models';
import { oplogEvents } from '../../../app/models/server/oplogEvents';

export const metrics = {};
const percentiles = [0.01, 0.1, 0.9, 0.99];

// Metrics
metrics.metricsRequests = new client.Counter({ name: 'rocketchat_metrics_requests', labelNames: ['notification_type'], help: 'cumulated number of calls to the metrics endpoint' });
metrics.metricsSize = new client.Gauge({ name: 'rocketchat_metrics_size', help: 'size of the metrics response in chars' });

metrics.info = new client.Gauge({ name: 'rocketchat_info', labelNames: ['version', 'unique_id', 'site_url'], help: 'Rocket.Chat info' });

metrics.meteorMethods = new client.Summary({
	name: 'rocketchat_meteor_methods',
	help: 'summary of meteor methods count and time',
	labelNames: ['method', 'has_connection', 'has_user'],
	percentiles,
});

metrics.rocketchatCallbacks = new client.Summary({
	name: 'rocketchat_callbacks',
	help: 'summary of rocketchat callbacks count and time',
	labelNames: ['hook', 'callback'],
	percentiles,
});

metrics.rocketchatHooks = new client.Summary({
	name: 'rocketchat_hooks',
	help: 'summary of rocketchat hooks count and time',
	labelNames: ['hook', 'callbacks_length'],
	percentiles,
});

metrics.rocketchatRestApi = new client.Summary({
	name: 'rocketchat_rest_api',
	help: 'summary of rocketchat rest api count and time',
	labelNames: ['method', 'entrypoint', 'user_agent', 'status', 'version'],
	percentiles,
});

metrics.meteorSubscriptions = new client.Summary({
	name: 'rocketchat_meteor_subscriptions',
	help: 'summary of meteor subscriptions count and time',
	labelNames: ['subscription'],
	percentiles,
});

metrics.messagesSent = new client.Counter({ name: 'rocketchat_message_sent', help: 'cumulated number of messages sent' });
metrics.notificationsSent = new client.Counter({ name: 'rocketchat_notification_sent', labelNames: ['notification_type'], help: 'cumulated number of notifications sent' });

metrics.ddpSessions = new client.Gauge({ name: 'rocketchat_ddp_sessions_count', help: 'number of open ddp sessions' });
metrics.ddpAuthenticatedSessions = new client.Gauge({ name: 'rocketchat_ddp_sessions_auth', help: 'number of authenticated open ddp sessions' });
metrics.ddpConnectedUsers = new client.Gauge({ name: 'rocketchat_ddp_connected_users', help: 'number of unique connected users' });
metrics.ddpRateLimitExceeded = new client.Counter({ name: 'rocketchat_ddp_rate_limit_exceeded', labelNames: ['limit_name', 'user_id', 'client_address', 'type', 'name', 'connection_id'], help: 'number of times a ddp rate limiter was exceeded' });

metrics.version = new client.Gauge({ name: 'rocketchat_version', labelNames: ['version'], help: 'Rocket.Chat version' });
metrics.migration = new client.Gauge({ name: 'rocketchat_migration', help: 'migration versoin' });
metrics.instanceCount = new client.Gauge({ name: 'rocketchat_instance_count', help: 'instances running' });
metrics.oplogEnabled = new client.Gauge({ name: 'rocketchat_oplog_enabled', labelNames: ['enabled'], help: 'oplog enabled' });
metrics.oplogQueue = new client.Gauge({ name: 'rocketchat_oplog_queue', labelNames: ['queue'], help: 'oplog queue' });
metrics.oplog = new client.Counter({
	name: 'rocketchat_oplog',
	help: 'summary of oplog operations',
	labelNames: ['collection', 'op'],
});

metrics.pushQueue = new client.Gauge({ name: 'rocketchat_push_queue', labelNames: ['queue'], help: 'push queue' });

// User statistics
metrics.totalUsers = new client.Gauge({ name: 'rocketchat_users_total', help: 'total of users' });
metrics.activeUsers = new client.Gauge({ name: 'rocketchat_users_active', help: 'total of active users' });
metrics.nonActiveUsers = new client.Gauge({ name: 'rocketchat_users_non_active', help: 'total of non active users' });
metrics.onlineUsers = new client.Gauge({ name: 'rocketchat_users_online', help: 'total of users online' });
metrics.awayUsers = new client.Gauge({ name: 'rocketchat_users_away', help: 'total of users away' });
metrics.offlineUsers = new client.Gauge({ name: 'rocketchat_users_offline', help: 'total of users offline' });

// Room statistics
metrics.totalRooms = new client.Gauge({ name: 'rocketchat_rooms_total', help: 'total of rooms' });
metrics.totalChannels = new client.Gauge({ name: 'rocketchat_channels_total', help: 'total of public rooms/channels' });
metrics.totalPrivateGroups = new client.Gauge({ name: 'rocketchat_private_groups_total', help: 'total of private rooms' });
metrics.totalDirect = new client.Gauge({ name: 'rocketchat_direct_total', help: 'total of direct rooms' });
metrics.totalLivechat = new client.Gauge({ name: 'rocketchat_livechat_total', help: 'total of livechat rooms' });

// Message statistics
metrics.totalMessages = new client.Gauge({ name: 'rocketchat_messages_total', help: 'total of messages' });
metrics.totalChannelMessages = new client.Gauge({ name: 'rocketchat_channel_messages_total', help: 'total of messages in public rooms' });
metrics.totalPrivateGroupMessages = new client.Gauge({ name: 'rocketchat_private_group_messages_total', help: 'total of messages in private rooms' });
metrics.totalDirectMessages = new client.Gauge({ name: 'rocketchat_direct_messages_total', help: 'total of messages in direct rooms' });
metrics.totalLivechatMessages = new client.Gauge({ name: 'rocketchat_livechat_messages_total', help: 'total of messages in livechat rooms' });

// Meteor Facts
metrics.meteorFacts = new client.Gauge({ name: 'rocketchat_meteor_facts', labelNames: ['pkg', 'fact'], help: 'internal meteor facts' });

Facts.incrementServerFact = function(pkg, fact, increment) {
	metrics.meteorFacts.inc({ pkg, fact }, increment);
};

const setPrometheusData = async () => {
	metrics.info.set({
		version: Info.version,
		unique_id: settings.get('uniqueID'),
		site_url: settings.get('Site_Url'),
	}, 1);

	const sessions = Array.from(Meteor.server.sessions.values());
	const authenticatedSessions = sessions.filter((s) => s.userId);
	metrics.ddpSessions.set(Meteor.server.sessions.size);
	metrics.ddpAuthenticatedSessions.set(authenticatedSessions.length);
	metrics.ddpConnectedUsers.set(_.unique(authenticatedSessions.map((s) => s.userId)).length);

	const statistics = Statistics.findLast();
	if (!statistics) {
		return;
	}

	metrics.version.set({ version: statistics.version }, 1);
	metrics.migration.set(Migrations._getControl().version);
	metrics.instanceCount.set(statistics.instanceCount);
	metrics.oplogEnabled.set({ enabled: statistics.oplogEnabled }, 1);

	// User statistics
	metrics.totalUsers.set(statistics.totalUsers);
	metrics.activeUsers.set(statistics.activeUsers);
	metrics.nonActiveUsers.set(statistics.nonActiveUsers);
	metrics.onlineUsers.set(statistics.onlineUsers);
	metrics.awayUsers.set(statistics.awayUsers);
	metrics.offlineUsers.set(statistics.offlineUsers);

	// Room statistics
	metrics.totalRooms.set(statistics.totalRooms);
	metrics.totalChannels.set(statistics.totalChannels);
	metrics.totalPrivateGroups.set(statistics.totalPrivateGroups);
	metrics.totalDirect.set(statistics.totalDirect);
	metrics.totalLivechat.set(statistics.totalLivechat);

	// Message statistics
	metrics.totalMessages.set(statistics.totalMessages);
	metrics.totalChannelMessages.set(statistics.totalChannelMessages);
	metrics.totalPrivateGroupMessages.set(statistics.totalPrivateGroupMessages);
	metrics.totalDirectMessages.set(statistics.totalDirectMessages);
	metrics.totalLivechatMessages.set(statistics.totalLivechatMessages);

	const oplogQueue = getOplogInfo().mongo._oplogHandle?._entryQueue?.length || 0;
	metrics.oplogQueue.set(oplogQueue);

	metrics.pushQueue.set(statistics.pushQueue || 0);
};

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	const data = client.register.metrics();

	metrics.metricsRequests.inc();
	metrics.metricsSize.set(data.length);

	res.end(data);
});

app.use('/', (req, res) => {
	const html = `<html>
		<head>
			<title>Rocket.Chat Prometheus Exporter</title>
		</head>
		<body>
			<h1>Rocket.Chat Prometheus Exporter</h1>
			<p><a href="/metrics">Metrics</a></p>
		</body>
	</html>`;

	res.write(html);
	res.end();
});

const server = http.createServer(app);

const oplogMetric = ({ collection, op }) => {
	metrics.oplog.inc({
		collection,
		op,
	});
};

let timer;
let resetTimer;
let defaultMetricsInitiated = false;
let gcStatsInitiated = false;
const was = {
	enabled: false,
	port: 9458,
	resetInterval: 0,
	collectGC: false,
};
const updatePrometheusConfig = async () => {
	const is = {
		port: process.env.PROMETHEUS_PORT || settings.get('Prometheus_Port'),
		enabled: settings.get('Prometheus_Enabled'),
		resetInterval: settings.get('Prometheus_Reset_Interval'),
		collectGC: settings.get('Prometheus_Garbage_Collector'),
	};

	if (Object.values(is).some((s) => s == null)) {
		return;
	}

	if (Object.entries(is).every(([k, v]) => v === was[k])) {
		return;
	}

	if (!is.enabled) {
		if (was.enabled) {
			console.log('Disabling Prometheus');
			server.close();
			Meteor.clearInterval(timer);
			oplogEvents.removeListener('record', oplogMetric);
		}
		Object.assign(was, is);
		return;
	}

	console.log('Configuring Prometheus', is);

	if (!was.enabled) {
		server.listen({
			port: is.port,
			host: process.env.BIND_IP || '0.0.0.0',
		});

		timer = Meteor.setInterval(setPrometheusData, 5000);
		oplogEvents.on('record', oplogMetric);
	}

	Meteor.clearInterval(resetTimer);
	if (is.resetInterval) {
		resetTimer = Meteor.setInterval(() => {
			client.register.getMetricsAsArray().forEach((metric) => { metric.hashMap = {}; });
		}, is.resetInterval);
	}

	// Prevent exceptions on calling those methods twice since
	// it's not possible to stop them to be able to restart
	try {
		if (defaultMetricsInitiated === false) {
			defaultMetricsInitiated = true;
			client.collectDefaultMetrics();
		}
		if (is.collectGC && gcStatsInitiated === false) {
			gcStatsInitiated = true;
			gcStats()();
		}
	} catch (error) {
		console.error(error);
	}

	Object.assign(was, is);
};

Meteor.startup(async () => {
	settings.get(/^Prometheus_.+/, updatePrometheusConfig);
});
