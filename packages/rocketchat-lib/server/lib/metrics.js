import { Meteor } from 'meteor/meteor';
import client from 'prom-client';
import connect from 'connect';
import http from 'http';
import _ from 'underscore';

RocketChat.promclient = client;
client.collectDefaultMetrics();

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.meteorMethods = new client.Summary({
	name: 'rocketchat_meteor_methods',
	help: 'summary of meteor methods count and time',
	labelNames: ['method', 'has_connection', 'has_user'],
});

RocketChat.metrics.rocketchatCallbacks = new client.Summary({
	name: 'rocketchat_callbacks',
	help: 'summary of rocketchat callbacks count and time',
	labelNames: ['hook', 'callback'],
});

RocketChat.metrics.rocketchatHooks = new client.Summary({
	name: 'rocketchat_hooks',
	help: 'summary of rocketchat hooks count and time',
	labelNames: ['hook', 'callbacks_length'],
});

RocketChat.metrics.rocketchatRestApi = new client.Summary({
	name: 'rocketchat_rest_api',
	help: 'summary of rocketchat rest api count and time',
	labelNames: ['method', 'entrypoint', 'user_agent', 'status', 'version'],
});

RocketChat.metrics.meteorSubscriptions = new client.Summary({
	name: 'rocketchat_meteor_subscriptions',
	help: 'summary of meteor subscriptions count and time',
	labelNames: ['subscription'],
});

RocketChat.metrics.messagesSent = new client.Counter({ name: 'rocketchat_message_sent', help: 'cumulated number of messages sent' });
RocketChat.metrics.notificationsSent = new client.Counter({ name: 'rocketchat_notification_sent', labelNames: ['notification_type'], help: 'cumulated number of notifications sent' });

RocketChat.metrics.ddpSessions = new client.Gauge({ name: 'rocketchat_ddp_sessions_count', help: 'number of open ddp sessions' });
RocketChat.metrics.ddpAthenticatedSessions = new client.Gauge({ name: 'rocketchat_ddp_sessions_auth', help: 'number of authenticated open ddp sessions' });
RocketChat.metrics.ddpConnectedUsers = new client.Gauge({ name: 'rocketchat_ddp_connected_users', help: 'number of unique connected users' });

RocketChat.metrics.version = new client.Gauge({ name: 'rocketchat_version', labelNames: ['version'], help: 'Rocket.Chat version' });
RocketChat.metrics.migration = new client.Gauge({ name: 'rocketchat_migration', help: 'migration versoin' });
RocketChat.metrics.instanceCount = new client.Gauge({ name: 'rocketchat_instance_count', help: 'instances running' });
RocketChat.metrics.oplogEnabled = new client.Gauge({ name: 'rocketchat_oplog_enabled', labelNames: ['enabled'], help: 'oplog enabled' });

// User statistics
RocketChat.metrics.totalUsers = new client.Gauge({ name: 'rocketchat_users_total', help: 'total of users' });
RocketChat.metrics.activeUsers = new client.Gauge({ name: 'rocketchat_users_active', help: 'total of active users' });
RocketChat.metrics.nonActiveUsers = new client.Gauge({ name: 'rocketchat_users_non_active', help: 'total of non active users' });
RocketChat.metrics.onlineUsers = new client.Gauge({ name: 'rocketchat_users_online', help: 'total of users online' });
RocketChat.metrics.awayUsers = new client.Gauge({ name: 'rocketchat_users_away', help: 'total of users away' });
RocketChat.metrics.offlineUsers = new client.Gauge({ name: 'rocketchat_users_offline', help: 'total of users offline' });

// Room statistics
RocketChat.metrics.totalRooms = new client.Gauge({ name: 'rocketchat_rooms_total', help: 'total of rooms' });
RocketChat.metrics.totalChannels = new client.Gauge({ name: 'rocketchat_channels_total', help: 'total of public rooms/channels' });
RocketChat.metrics.totalPrivateGroups = new client.Gauge({ name: 'rocketchat_private_groups_total', help: 'total of private rooms' });
RocketChat.metrics.totalDirect = new client.Gauge({ name: 'rocketchat_direct_total', help: 'total of direct rooms' });
RocketChat.metrics.totalLivechat = new client.Gauge({ name: 'rocketchat_livechat_total', help: 'total of livechat rooms' });

// Message statistics
RocketChat.metrics.totalMessages = new client.Gauge({ name: 'rocketchat_messages_total', help: 'total of messages' });
RocketChat.metrics.totalChannelMessages = new client.Gauge({ name: 'rocketchat_channel_messages_total', help: 'total of messages in public rooms' });
RocketChat.metrics.totalPrivateGroupMessages = new client.Gauge({ name: 'rocketchat_private_group_messages_total', help: 'total of messages in private rooms' });
RocketChat.metrics.totalDirectMessages = new client.Gauge({ name: 'rocketchat_direct_messages_total', help: 'total of messages in direct rooms' });
RocketChat.metrics.totalLivechatMessages = new client.Gauge({ name: 'rocketchat_livechat_messages_total', help: 'total of messages in livechat rooms' });

client.register.setDefaultLabels({
	uniqueId: RocketChat.settings.get('uniqueID'),
	siteUrl: RocketChat.settings.get('Site_Url'),
});

const setPrometheusData = () => {
	const date = new Date();

	client.register.setDefaultLabels({
		unique_id: RocketChat.settings.get('uniqueID'),
		site_url: RocketChat.settings.get('Site_Url'),
		version: RocketChat.Info.version,
	});

	const sessions = Object.values(Meteor.server.sessions);
	const authenticatedSessions = sessions.filter((s) => s.userId);
	RocketChat.metrics.ddpSessions.set(sessions.length, date);
	RocketChat.metrics.ddpAthenticatedSessions.set(authenticatedSessions.length, date);
	RocketChat.metrics.ddpConnectedUsers.set(_.unique(authenticatedSessions.map((s) => s.userId)).length, date);

	if (!RocketChat.models.Statistics) {
		return;
	}

	const statistics = RocketChat.models.Statistics.findLast();
	if (!statistics) {
		return;
	}

	RocketChat.metrics.version.set({ version: statistics.version }, 1, date);
	RocketChat.metrics.migration.set(RocketChat.Migrations._getControl().version, date);
	RocketChat.metrics.instanceCount.set(statistics.instanceCount, date);
	RocketChat.metrics.oplogEnabled.set({ enabled: statistics.oplogEnabled }, 1, date);

	// User statistics
	RocketChat.metrics.totalUsers.set(statistics.totalUsers, date);
	RocketChat.metrics.activeUsers.set(statistics.activeUsers, date);
	RocketChat.metrics.nonActiveUsers.set(statistics.nonActiveUsers, date);
	RocketChat.metrics.onlineUsers.set(statistics.onlineUsers, date);
	RocketChat.metrics.awayUsers.set(statistics.awayUsers, date);
	RocketChat.metrics.offlineUsers.set(statistics.offlineUsers, date);

	// Room statistics
	RocketChat.metrics.totalRooms.set(statistics.totalRooms, date);
	RocketChat.metrics.totalChannels.set(statistics.totalChannels, date);
	RocketChat.metrics.totalPrivateGroups.set(statistics.totalPrivateGroups, date);
	RocketChat.metrics.totalDirect.set(statistics.totalDirect, date);
	RocketChat.metrics.totalLivechat.set(statistics.totalLivechat, date);

	// Message statistics
	RocketChat.metrics.totalMessages.set(statistics.totalMessages, date);
	RocketChat.metrics.totalChannelMessages.set(statistics.totalChannelMessages, date);
	RocketChat.metrics.totalPrivateGroupMessages.set(statistics.totalPrivateGroupMessages, date);
	RocketChat.metrics.totalDirectMessages.set(statistics.totalDirectMessages, date);
	RocketChat.metrics.totalLivechatMessages.set(statistics.totalLivechatMessages, date);
};

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.end(RocketChat.promclient.register.metrics());
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

let timer;
const updatePrometheusConfig = () => {
	const port = RocketChat.settings.get('Prometheus_Port');
	const enabled = RocketChat.settings.get('Prometheus_Enabled');

	if (port == null || enabled == null) {
		return;
	}

	if (enabled === true) {
		server.listen({
			port,
			host: process.env.BIND_IP || '0.0.0.0',
		});
		timer = Meteor.setInterval(setPrometheusData, 5000);
	} else {
		server.close();
		Meteor.clearInterval(timer);
	}
};

RocketChat.settings.get('Prometheus_Enabled', updatePrometheusConfig);
RocketChat.settings.get('Prometheus_Port', updatePrometheusConfig);
