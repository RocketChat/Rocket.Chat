import http from 'http';

import client from 'prom-client';
import connect from 'connect';
import _ from 'underscore';
import gcStats from 'prometheus-gc-stats';
import { Meteor } from 'meteor/meteor';
import { Facts } from 'meteor/facts-base';

import { Info, getOplogInfo } from '../../../utils/server';
import { getControl } from '../../../../server/lib/migrations';
import { settings } from '../../../settings/server';
import { Statistics } from '../../../models/server/raw';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { metrics } from './metrics';
import { getAppsStatistics } from '../../../statistics/server/lib/getAppsStatistics';

Facts.incrementServerFact = function (pkg: 'pkg' | 'fact', fact: string | number, increment: number): void {
	metrics.meteorFacts.inc({ pkg, fact }, increment);
};

const setPrometheusData = async (): Promise<void> => {
	metrics.info.set(
		{
			version: Info.version,
			// eslint-disable-next-line @typescript-eslint/camelcase
			unique_id: settings.get<string>('uniqueID'),
			// eslint-disable-next-line @typescript-eslint/camelcase
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
	const { totalInstalled, totalActive, totalFailed } = getAppsStatistics();

	metrics.totalAppsInstalled.set(totalInstalled || 0);
	metrics.totalAppsEnabled.set(totalActive || 0);
	metrics.totalAppsFailed.set(totalFailed || 0);

	const oplogQueue = getOplogInfo().mongo._oplogHandle?._entryQueue?.length || 0;
	metrics.oplogQueue.set(oplogQueue);

	const statistics = await Statistics.findLast();
	if (!statistics) {
		return;
	}

	metrics.version.set({ version: statistics.version }, 1);
	metrics.migration.set(getControl().version);
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

	metrics.pushQueue.set(statistics.pushQueue || 0);
};

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (_req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	client.register.metrics().then((data) => {
		metrics.metricsRequests.inc();
		metrics.metricsSize.set(data.length);

		res.end(data);
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

let timer: number;
let resetTimer: number;
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
			Meteor.clearInterval(timer);
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

		timer = Meteor.setInterval(setPrometheusData, 5000);
	}

	Meteor.clearInterval(resetTimer);
	if (is.resetInterval) {
		resetTimer = Meteor.setInterval(() => {
			client.register.getMetricsAsArray().then((metrics) => {
				metrics.forEach((metric) => {
					// @ts-expect-error
					metric.hashMap = {};
				});
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
		SystemLogger.error(error);
	}

	Object.assign(was, is);
};

Meteor.startup(async () => {
	settings.watchByRegex(/^Prometheus_.+/, updatePrometheusConfig);
});
