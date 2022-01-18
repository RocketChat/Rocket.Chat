import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import UAParser from 'ua-parser-js';

import { UAParserMobile, UAParserDesktop } from './UAParserCustom';
import { Sessions } from '../../../models/server/raw';
import { aggregates } from '../../../models/server/raw/Sessions';
import { Logger } from '../../../../server/lib/logger/Logger';
import { getMostImportantRole } from './getMostImportantRole';
import { sauEvents } from '../../../../server/services/sauMonitor/events';

const getDateObj = (dateTime = new Date()) => ({
	day: dateTime.getDate(),
	month: dateTime.getMonth() + 1,
	year: dateTime.getFullYear(),
});

const logger = new Logger('SAUMonitor');

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitorClass {
	constructor() {
		this._started = false;
		this._today = getDateObj();
		this._dailyComputeJobName = 'aggregate-sessions';
		this._dailyFinishSessionsJobName = 'aggregate-sessions';
	}

	async start() {
		if (this.isRunning()) {
			return;
		}

		await this._startMonitoring();

		this._started = true;
		logger.debug('[start]');
	}

	stop() {
		if (!this.isRunning()) {
			return;
		}

		this._started = false;

		SyncedCron.remove(this._dailyComputeJobName);
		SyncedCron.remove(this._dailyFinishSessionsJobName);

		logger.debug('[stop]');
	}

	isRunning() {
		return this._started === true;
	}

	async _startMonitoring() {
		try {
			this._handleAccountEvents();
			this._handleOnConnection();
			this._startCronjobs();
		} catch (err) {
			throw new Meteor.Error(err);
		}
	}

	_handleOnConnection() {
		if (this.isRunning()) {
			return;
		}

		sauEvents.on('socket.disconnected', async ({ connection }) => {
			if (!this.isRunning()) {
				return;
			}

			await Sessions.closeByInstanceIdAndSessionId(connection.instanceId, connection.id);
		});
	}

	_handleAccountEvents() {
		if (this.isRunning()) {
			return;
		}

		sauEvents.on('accounts.login', async ({ userId, connection }) => {
			if (!this.isRunning()) {
				return;
			}
			console.log('accounts.login', userId, connection);

			// TODO need to perform a find on user to get his roles
			// const { roles = ['user'], _id: userId } = info.user;
			const roles = ['user'];

			const mostImportantRole = getMostImportantRole(roles);

			const loginAt = new Date();
			const params = { userId, roles, mostImportantRole, loginAt, ...getDateObj() };
			await this._handleSession(connection, params);

			// TODO MS: need to take a look at this since it looks meteor's connections
			this._updateConnectionInfo(connection.id, { loginAt });
		});

		sauEvents.on('accounts.logout', async ({ userId, connection }) => {
			if (!this.isRunning()) {
				return;
			}

			await Sessions.logoutByInstanceIdAndSessionIdAndUserId(connection.instanceId, connection.id, userId);
		});
	}

	async _handleSession(connection, params) {
		const data = this._getConnectionInfo(connection, params);
		await Sessions.createOrUpdate(data);
	}

	async _finishSessionsFromDate(yesterday, today) {
		if (!this.isRunning()) {
			return;
		}

		const { day, month, year } = getDateObj(yesterday);
		const beforeDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);

		const currentDate = getDateObj(today);
		const nextDateTime = new Date(currentDate.year, currentDate.month - 1, currentDate.day);

		const cursor = Sessions.findSessionsNotClosedByDateWithoutLastActivity({ year, month, day });

		const batch = [];

		for await (const session of cursor) {
			// create a new session for the current day
			batch.push({
				...session,
				...currentDate,
				createdAt: nextDateTime,
			});

			if (batch.length === 2) {
				await Sessions.createBatch(batch);
				batch.length = 0;
			}
		}

		if (batch.length > 0) {
			await Sessions.createBatch(batch);
		}

		// close all sessions from current 'date'
		await Sessions.updateActiveSessionsByDate(
			{ year, month, day },
			{
				lastActivityAt: beforeDateTime,
			},
		);

		// TODO missing an action to perform on dangling sessions (for example remove sessions not closed one month ago)
	}

	_getConnectionInfo(connection, params = {}) {
		if (!connection) {
			return;
		}

		const ip = connection.httpHeaders
			? connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for']
			: connection.clientAddress;
		const host = connection.httpHeaders && connection.httpHeaders.host;
		const info = {
			type: 'session',
			sessionId: connection.id,
			instanceId: connection.instanceId,
			ip,
			host,
			...this._getUserAgentInfo(connection),
			...params,
		};

		if (connection.loginAt) {
			info.loginAt = connection.loginAt;
		}

		return info;
	}

	_getUserAgentInfo(connection) {
		if (!(connection && connection.httpHeaders && connection.httpHeaders['user-agent'])) {
			return;
		}

		const uaString = connection.httpHeaders['user-agent'];
		let result;

		if (UAParserMobile.isMobileApp(uaString)) {
			result = UAParserMobile.uaObject(uaString);
		} else if (UAParserDesktop.isDesktopApp(uaString)) {
			result = UAParserDesktop.uaObject(uaString);
		} else {
			const ua = new UAParser(uaString);
			result = ua.getResult();
		}

		const info = {
			type: 'other',
		};

		const removeEmptyProps = (obj) => {
			Object.keys(obj).forEach((p) => (!obj[p] || obj[p] === undefined) && delete obj[p]);
			return obj;
		};

		if (result.browser && result.browser.name) {
			info.type = 'browser';
			info.name = result.browser.name;
			info.longVersion = result.browser.version;
		}

		if (result.os && result.os.name) {
			info.os = removeEmptyProps(result.os);
		}

		if (result.device && (result.device.type || result.device.model)) {
			info.type = result.device.type;

			if (result.app && result.app.name) {
				info.name = result.app.name;
				info.longVersion = result.app.version;
				if (result.app.bundle) {
					info.longVersion += ` ${result.app.bundle}`;
				}
			}
		}

		if (typeof info.longVersion === 'string') {
			info.version = info.longVersion.match(/(\d+\.){0,2}\d+/)[0];
		}

		return {
			device: info,
		};
	}

	_updateConnectionInfo(sessionId, data = {}) {
		if (!sessionId) {
			return;
		}
		const session = Meteor.server.sessions.get(sessionId);
		if (session) {
			Object.keys(data).forEach((p) => {
				session.connectionHandle = Object.assign({}, session.connectionHandle, { [p]: data[p] });
			});
		}
	}

	_startCronjobs() {
		logger.info('[aggregate] - Start Cron.');

		SyncedCron.add({
			name: this._dailyComputeJobName,
			schedule: (parser) => parser.text('at 2:00 am'),
			job: async () => {
				await this.aggregate();
			},
		});

		SyncedCron.add({
			name: this._dailyFinishSessionsJobName,
			schedule: (parser) => parser.text('at 1:05 am'),
			job: async () => {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);

				await this._finishSessionsFromDate(yesterday, new Date());
			},
		});
	}

	async aggregate() {
		if (!this.isRunning()) {
			return;
		}

		logger.info('[aggregate] - Aggregating data.');

		const date = new Date();
		date.setDate(date.getDate() - 0); // yesterday
		const yesterday = getDateObj(date);

		const match = {
			type: 'session',
			year: { $lte: yesterday.year },
			month: { $lte: yesterday.month },
			day: { $lte: yesterday.day },
		};

		await aggregates.dailySessionsOfYesterday(Sessions.col, yesterday).forEach(async (record) => {
			record._id = `${record.userId}-${record.year}-${record.month}-${record.day}`;
			await Sessions.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
		});

		await Sessions.updateMany(match, {
			$set: {
				type: 'computed-session',
				_computedAt: new Date(),
			},
		});
	}
}
