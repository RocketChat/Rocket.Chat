import client from 'prom-client';

export const metrics = {};
const percentiles = [0.01, 0.1, 0.9, 0.99];

// Metrics
metrics.metricsRequests = new client.Counter({
	name: 'rocketchat_metrics_requests',
	labelNames: ['notification_type'],
	help: 'cumulated number of calls to the metrics endpoint',
});
metrics.metricsSize = new client.Gauge({
	name: 'rocketchat_metrics_size',
	help: 'size of the metrics response in chars',
});

metrics.info = new client.Gauge({
	name: 'rocketchat_info',
	labelNames: ['version', 'unique_id', 'site_url'],
	help: 'Rocket.Chat info',
});

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

metrics.messagesSent = new client.Counter({
	name: 'rocketchat_message_sent',
	help: 'cumulated number of messages sent',
});
metrics.notificationsSent = new client.Counter({
	name: 'rocketchat_notification_sent',
	labelNames: ['notification_type'],
	help: 'cumulated number of notifications sent',
});
metrics.messageRoundtripTime = new client.Gauge({
	name: 'rocketchat_messages_roundtrip_time',
	help: 'time spent by a message from save to receive back',
});

metrics.ddpSessions = new client.Gauge({
	name: 'rocketchat_ddp_sessions_count',
	help: 'number of open ddp sessions',
});
metrics.ddpAuthenticatedSessions = new client.Gauge({
	name: 'rocketchat_ddp_sessions_auth',
	help: 'number of authenticated open ddp sessions',
});
metrics.ddpConnectedUsers = new client.Gauge({
	name: 'rocketchat_ddp_connected_users',
	help: 'number of unique connected users',
});
metrics.ddpRateLimitExceeded = new client.Counter({
	name: 'rocketchat_ddp_rate_limit_exceeded',
	labelNames: ['limit_name', 'user_id', 'client_address', 'type', 'name', 'connection_id'],
	help: 'number of times a ddp rate limiter was exceeded',
});

metrics.version = new client.Gauge({
	name: 'rocketchat_version',
	labelNames: ['version'],
	help: 'Rocket.Chat version',
});
metrics.migration = new client.Gauge({ name: 'rocketchat_migration', help: 'migration versoin' });
metrics.instanceCount = new client.Gauge({
	name: 'rocketchat_instance_count',
	help: 'instances running',
});
metrics.oplogEnabled = new client.Gauge({
	name: 'rocketchat_oplog_enabled',
	labelNames: ['enabled'],
	help: 'oplog enabled',
});
metrics.oplogQueue = new client.Gauge({
	name: 'rocketchat_oplog_queue',
	labelNames: ['queue'],
	help: 'oplog queue',
});
metrics.oplog = new client.Counter({
	name: 'rocketchat_oplog',
	help: 'summary of oplog operations',
	labelNames: ['collection', 'op'],
});

metrics.pushQueue = new client.Gauge({
	name: 'rocketchat_push_queue',
	labelNames: ['queue'],
	help: 'push queue',
});

// User statistics
metrics.totalUsers = new client.Gauge({ name: 'rocketchat_users_total', help: 'total of users' });
metrics.activeUsers = new client.Gauge({
	name: 'rocketchat_users_active',
	help: 'total of active users',
});
metrics.nonActiveUsers = new client.Gauge({
	name: 'rocketchat_users_non_active',
	help: 'total of non active users',
});
metrics.onlineUsers = new client.Gauge({
	name: 'rocketchat_users_online',
	help: 'total of users online',
});
metrics.awayUsers = new client.Gauge({
	name: 'rocketchat_users_away',
	help: 'total of users away',
});
metrics.offlineUsers = new client.Gauge({
	name: 'rocketchat_users_offline',
	help: 'total of users offline',
});

// Room statistics
metrics.totalRooms = new client.Gauge({ name: 'rocketchat_rooms_total', help: 'total of rooms' });
metrics.totalChannels = new client.Gauge({
	name: 'rocketchat_channels_total',
	help: 'total of public rooms/channels',
});
metrics.totalPrivateGroups = new client.Gauge({
	name: 'rocketchat_private_groups_total',
	help: 'total of private rooms',
});
metrics.totalDirect = new client.Gauge({
	name: 'rocketchat_direct_total',
	help: 'total of direct rooms',
});
metrics.totalLivechat = new client.Gauge({
	name: 'rocketchat_livechat_total',
	help: 'total of livechat rooms',
});

// Message statistics
metrics.totalMessages = new client.Gauge({
	name: 'rocketchat_messages_total',
	help: 'total of messages',
});
metrics.totalChannelMessages = new client.Gauge({
	name: 'rocketchat_channel_messages_total',
	help: 'total of messages in public rooms',
});
metrics.totalPrivateGroupMessages = new client.Gauge({
	name: 'rocketchat_private_group_messages_total',
	help: 'total of messages in private rooms',
});
metrics.totalDirectMessages = new client.Gauge({
	name: 'rocketchat_direct_messages_total',
	help: 'total of messages in direct rooms',
});
metrics.totalLivechatMessages = new client.Gauge({
	name: 'rocketchat_livechat_messages_total',
	help: 'total of messages in livechat rooms',
});

// Apps metrics
metrics.totalAppsInstalled = new client.Gauge({
	name: 'rocketchat_apps_installed',
	help: 'total apps installed',
});
metrics.totalAppsEnabled = new client.Gauge({
	name: 'rocketchat_apps_enabled',
	help: 'total apps enabled',
});
metrics.totalAppsFailed = new client.Gauge({
	name: 'rocketchat_apps_failed',
	help: 'total apps that failed to load',
});

// Meteor Facts
metrics.meteorFacts = new client.Gauge({
	name: 'rocketchat_meteor_facts',
	labelNames: ['pkg', 'fact'],
	help: 'internal meteor facts',
});
