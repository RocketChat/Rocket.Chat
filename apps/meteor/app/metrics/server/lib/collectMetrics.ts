import http from 'http';

import { Rooms, Statistics, Users } from '@rocket.chat/models';
import { tracerSpan } from '@rocket.chat/tracing';
import connect from 'connect';
import { Facts } from 'meteor/facts-base';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import client from 'prom-client';
import gcStats from 'prometheus-gc-stats';
import _ from 'underscore';

import { metrics } from './metrics';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { getControl } from '../../../../server/lib/migrations';
import { settings } from '../../../settings/server';
import { getAppsStatistics } from '../../../statistics/server/lib/getAppsStatistics';
import { Info } from '../../../utils/rocketchat.info';

const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

Facts.incrementServerFact = function (pkg: 'pkg' | 'fact', fact: string | number, increment: number): void {
	metrics.meteorFacts.inc({ pkg, fact }, increment);
};

const setPrometheusData = async (): Promise<void> => {
	metrics.info.set(
		{
			version: Info.version,
			unique_id: settings.get<string>('uniqueID'),
			site_url: settings.get<string>('Site_Url'),
		},
		1,
	);

	const sessions = Array.from<{ userId: string }>(Meteor.server.sessions.values());
	const authenticatedSessions = sessions.filter((s) => s.userId);
	metrics.ddpSessions.set(Meteor.server.sessions.size);
	metrics.ddpAuthenticatedSessions.set(authenticatedSessions.length);
	metrics.ddpConnectedUsers.set(_.unique(authenticatedSessions.map((s) => s.userId)).length);

	// Apps metrics
	const { totalInstalled, totalActive, totalFailed } = await getAppsStatistics();

	metrics.totalAppsInstalled.set(totalInstalled || 0);
	metrics.totalAppsEnabled.set(totalActive || 0);
	metrics.totalAppsFailed.set(totalFailed || 0);

	const oplogQueue = (mongo as any)._oplogHandle?._entryQueue?.length || 0;
	metrics.oplogQueue.set(oplogQueue);

	const statistics = await Statistics.findLast();
	if (!statistics) {
		return;
	}

	metrics.version.set({ version: statistics.version }, 1);
	metrics.migration.set((await getControl()).version);
	metrics.instanceCount.set(statistics.instanceCount);
	metrics.oplogEnabled.set({ enabled: `${statistics.oplogEnabled}` }, 1);

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

	// Livechat stats
	metrics.totalLivechatVisitors.set(statistics.totalLivechatVisitors);
	metrics.totalLivechatAgents.set(statistics.totalLivechatAgents);

	metrics.pushQueue.set(statistics.pushQueue || 0);

	// Federation statistics
	await collectFederationMetrics();
};

/**
 * Collects federation-related gauge metrics by querying the database.
 * This includes counts of federated rooms and users.
 */
const collectFederationMetrics = async (): Promise<void> => {
	try {
		// Check if federation is enabled before collecting metrics
		const federationEnabled = settings.get<boolean>('Federation_Matrix_enabled');
		if (!federationEnabled) {
			return;
		}

		const serverName = settings.get<string>('Federation_Matrix_homeserver_domain') || '';

		// Count federated rooms by type
		const federatedChannels = await Rooms.col.countDocuments({
			't': 'c',
			'federation.mrid': { $exists: true },
		});
		const federatedPrivateGroups = await Rooms.col.countDocuments({
			't': 'p',
			'federation.mrid': { $exists: true },
		});
		const federatedDirect = await Rooms.col.countDocuments({
			't': 'd',
			'federation.mrid': { $exists: true },
		});

		metrics.totalFederatedChannels.set(federatedChannels);
		metrics.totalFederatedPrivateGroups.set(federatedPrivateGroups);
		metrics.totalFederatedDirectMessages.set(federatedDirect);

		// Count federated rooms by origin
		const federatedRoomsByOrigin = await Rooms.col
			.aggregate<{ _id: { room_type: string; origin: string }; count: number }>([
				{ $match: { 'federation.mrid': { $exists: true } } },
				{
					$group: {
						_id: { room_type: '$t', origin: '$federation.origin' },
						count: { $sum: 1 },
					},
				},
			])
			.toArray();

		// Reset all federated room gauges before setting new values
		metrics.totalFederatedRooms.reset();

		for (const { _id, count } of federatedRoomsByOrigin) {
			const isLocal = _id.origin === serverName;
			metrics.totalFederatedRooms.set(
				{
					room_type: _id.room_type,
					origin: isLocal ? 'local' : _id.origin || 'unknown',
				},
				count,
			);
		}

		// Count federated users by origin
		const federatedUsersByOrigin = await Users.col
			.aggregate<{
				_id: string;
				count: number;
			}>([
				{ $match: { 'federated': true, 'federation.origin': { $exists: true } } },
				{ $group: { _id: '$federation.origin', count: { $sum: 1 } } },
			])
			.toArray();

		// Reset federated users gauge before setting new values
		metrics.totalFederatedUsers.reset();

		for (const { _id: origin, count } of federatedUsersByOrigin) {
			metrics.totalFederatedUsers.set({ origin: origin || 'unknown' }, count);
		}
	} catch (error) {
		SystemLogger.error({ msg: 'Error collecting federation metrics', error });
	}
};

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (_req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	client.register
		.metrics()
		.then((data) => {
			metrics.metricsRequests.inc();
			metrics.metricsSize.set(data.length);

			res.end(data);
		})
		.catch((err) => {
			SystemLogger.error({ msg: 'Error while collecting metrics', err });
			res.end();
		});
});

app.use('/', (_req, res) => {
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

let timer: NodeJS.Timeout;
let resetTimer: NodeJS.Timeout;
let defaultMetricsInitiated = false;
let gcStatsInitiated = false;
const was = {
	enabled: false,
	port: 9458,
	resetInterval: 0,
	collectGC: false,
};
const updatePrometheusConfig = async (): Promise<void> => {
	const is = {
		port: process.env.PROMETHEUS_PORT || settings.get('Prometheus_Port'),
		enabled: settings.get<boolean>('Prometheus_Enabled'),
		resetInterval: settings.get<number>('Prometheus_Reset_Interval'),
		collectGC: settings.get<boolean>('Prometheus_Garbage_Collector'),
	};

	if (Object.values(is).some((s) => s == null)) {
		return;
	}

	if (Object.entries(is).every(([k, v]) => v === was[k as keyof typeof was])) {
		return;
	}

	if (!is.enabled) {
		if (was.enabled) {
			SystemLogger.info('Disabling Prometheus');
			server.close();
			clearInterval(timer);
		}
		Object.assign(was, is);
		return;
	}

	SystemLogger.debug({ msg: 'Configuring Prometheus', is });

	if (!was.enabled) {
		server.listen({
			port: is.port,
			host: process.env.BIND_IP || '0.0.0.0',
		});

		timer = setInterval(async () => {
			void tracerSpan(
				'setPrometheusData',
				{
					attributes: {
						port: is.port,
						host: process.env.BIND_IP || '0.0.0.0',
					},
				},
				() => {
					void setPrometheusData();
				},
			);
		}, 5000);
	}

	clearInterval(resetTimer);
	if (is.resetInterval) {
		resetTimer = setInterval(() => {
			client.register.getMetricsAsArray().forEach((metric) => {
				// @ts-expect-error Property 'hashMap' does not exist on type 'metric'.
				metric.hashMap = {};
			});
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
			gcStats(client.register)();
		}
	} catch (error) {
		SystemLogger.error({ err: error });
	}

	Object.assign(was, is);
};

Meteor.startup(async () => {
	settings.watchByRegex(/^Prometheus_.+/, updatePrometheusConfig);
});
