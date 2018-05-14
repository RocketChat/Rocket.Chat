import client from 'prom-client';
import connect from 'connect';
import http from 'http';
import _ from 'underscore';

RocketChat.promclient = client;
client.collectDefaultMetrics();

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter({'name': 'message_sent', 'help': 'cumulated number of messages sent'});
RocketChat.metrics.ddpSessions = new client.Gauge({'name': 'ddp_sessions_count', 'help': 'number of open ddp sessions'});
RocketChat.metrics.ddpConnectedUsers = new client.Gauge({'name': 'ddp_connected_users', 'help': 'number of connected users'});

RocketChat.metrics.version = new client.Gauge({'name': 'version', labelNames: ['version'], 'help': 'Rocket.Chat version'});
RocketChat.metrics.migration = new client.Gauge({'name': 'migration', 'help': 'migration versoin'});
RocketChat.metrics.instanceCount = new client.Gauge({'name': 'instance_count', 'help': 'instances running'});
RocketChat.metrics.oplogEnabled = new client.Gauge({'name': 'oplog_enabled', labelNames: ['enabled'], 'help': 'oplog enabled'});

// User statistics
RocketChat.metrics.totalUsers = new client.Gauge({'name': 'users_total', 'help': 'total of users'});
RocketChat.metrics.activeUsers = new client.Gauge({'name': 'users_active', 'help': 'total of active users'});
RocketChat.metrics.nonActiveUsers = new client.Gauge({'name': 'users_non_active', 'help': 'total of non active users'});
RocketChat.metrics.onlineUsers = new client.Gauge({'name': 'users_online', 'help': 'total of users online'});
RocketChat.metrics.awayUsers = new client.Gauge({'name': 'users_away', 'help': 'total of users away'});
RocketChat.metrics.offlineUsers = new client.Gauge({'name': 'users_offline', 'help': 'total of users offline'});

// Room statistics
RocketChat.metrics.totalRooms = new client.Gauge({'name': 'rooms_total', 'help': 'total of rooms'});
RocketChat.metrics.totalChannels = new client.Gauge({'name': 'channels_total', 'help': 'total of public rooms/channels'});
RocketChat.metrics.totalPrivateGroups = new client.Gauge({'name': 'private_groups_total', 'help': 'total of private rooms'});
RocketChat.metrics.totalDirect = new client.Gauge({'name': 'direct_total', 'help': 'total of direct rooms'});
RocketChat.metrics.totalLivechat = new client.Gauge({'name': 'livechat_total', 'help': 'total of livechat rooms'});

// Message statistics
RocketChat.metrics.totalMessages = new client.Gauge({'name': 'messages_total', 'help': 'total of messages'});
RocketChat.metrics.totalChannelMessages = new client.Gauge({'name': 'channel_messages_total', 'help': 'total of messages in public rooms'});
RocketChat.metrics.totalPrivateGroupMessages = new client.Gauge({'name': 'private_group_messages_total', 'help': 'total of messages in private rooms'});
RocketChat.metrics.totalDirectMessages = new client.Gauge({'name': 'direct_messages_total', 'help': 'total of messages in direct rooms'});
RocketChat.metrics.totalLivechatMessages = new client.Gauge({'name': 'livechat_messages_total', 'help': 'total of messages in livechat rooms'});

client.register.setDefaultLabels({
	uniqueId: RocketChat.settings.get('uniqueID'),
	siteUrl: RocketChat.settings.get('Site_Url')
});

const setPrometheusData = () => {
	client.register.setDefaultLabels({
		unique_id: RocketChat.settings.get('uniqueID'),
		site_url: RocketChat.settings.get('Site_Url'),
		version: RocketChat.Info.version
	});

	RocketChat.metrics.ddpSessions.set(Object.keys(Meteor.server.sessions).length);
	RocketChat.metrics.ddpConnectedUsers.set(_.compact(_.unique(Object.values(Meteor.server.sessions).map(s => s.userId))).length);

	const statistics = RocketChat.models.Statistics.findLast();
	if (!statistics) {
		return;
	}

	RocketChat.metrics.version.set({version: statistics.version}, 1);
	RocketChat.metrics.migration.set(RocketChat.Migrations._getControl().version);
	RocketChat.metrics.instanceCount.set(statistics.instanceCount);
	RocketChat.metrics.oplogEnabled.set({enabled: statistics.oplogEnabled}, 1);

	// User statistics
	RocketChat.metrics.totalUsers.set(statistics.totalUsers);
	RocketChat.metrics.activeUsers.set(statistics.activeUsers);
	RocketChat.metrics.nonActiveUsers.set(statistics.nonActiveUsers);
	RocketChat.metrics.onlineUsers.set(statistics.onlineUsers);
	RocketChat.metrics.awayUsers.set(statistics.awayUsers);
	RocketChat.metrics.offlineUsers.set(statistics.offlineUsers);

	// Room statistics
	RocketChat.metrics.totalRooms.set(statistics.totalRooms);
	RocketChat.metrics.totalChannels.set(statistics.totalChannels);
	RocketChat.metrics.totalPrivateGroups.set(statistics.totalPrivateGroups);
	RocketChat.metrics.totalDirect.set(statistics.totalDirect);
	RocketChat.metrics.totalLivechat.set(statistics.totlalLivechat);

	// Message statistics
	RocketChat.metrics.totalMessages.set(statistics.totalMessages);
	RocketChat.metrics.totalChannelMessages.set(statistics.totalChannelMessages);
	RocketChat.metrics.totalPrivateGroupMessages.set(statistics.totalPrivateGroupMessages);
	RocketChat.metrics.totalDirectMessages.set(statistics.totalDirectMessages);
	RocketChat.metrics.totalLivechatMessages.set(statistics.totalLivechatMessages);
};

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.end(RocketChat.promclient.register.metrics());
});

const server = http.createServer(app);

let timer;
RocketChat.settings.get('Prometheus_Enabled', (key, value) => {
	if (value === true) {
		server.listen({
			port: 9100,
			host: process.env.BIND_IP || '0.0.0.0'
		});
		timer = Meteor.setInterval(setPrometheusData, 5000);
	} else {
		server.close();
		Meteor.clearInterval(timer);
	}
});
