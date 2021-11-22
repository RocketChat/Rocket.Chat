import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import UAParser from 'ua-parser-js';

import { UAParserMobile, UAParserDesktop } from './UAParserCustom';
import { Sessions } from '../../../models/server/raw';
import { aggregates } from '../../../models/server/raw/Sessions';
import { Logger } from '../../../logger';
import { getMostImportantRole } from './getMostImportantRole';

const getDateObj = (dateTime = new Date()) => ({
	day: dateTime.getDate(),
	month: dateTime.getMonth() + 1,
	year: dateTime.getFullYear(),
});

const isSameDateObj = (oldest, newest) => oldest.year === newest.year && oldest.month === newest.month && oldest.day === newest.day;

const logger = new Logger('SAUMonitor');

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitorClass {
	constructor() {
		this._started = false;
		this._monitorTime = 60000;
		this._timer = null;
		this._today = getDateObj();
		this._instanceId = null;
		this._jobName = 'aggregate-sessions';
	}

	async start(instanceId) {
		if (this.isRunning()) {
			return;
		}

		this._instanceId = instanceId;

		if (!this._instanceId) {
			logger.debug('[start] - InstanceId is not defined.');
			return;
		}

		await this._startMonitoring(() => {
			this._started = true;
			logger.debug(`[start] - InstanceId: ${ this._instanceId }`);
		});
	}

	stop() {
		if (!this.isRunning()) {
			return;
		}

		this._started = false;

		if (this._timer) {
			Meteor.clearInterval(this._timer);
		}

		SyncedCron.remove(this._jobName);

		logger.debug(`[stop] - InstanceId: ${ this._instanceId }`);
	}

	isRunning() {
		return this._started === true;
	}

	async _startMonitoring(callback) {
		try {
			this._handleAccountEvents();
			this._handleOnConnection();
			this._startSessionControl();
			await this._initActiveServerSessions();
			this._startAggregation();
			if (callback) {
				callback();
			}
		} catch (err) {
			throw new Meteor.Error(err);
		}
	}

	_startSessionControl() {
		if (this.isRunning()) {
			return;
		}

		if (this._monitorTime < 0) {
			return;
		}

		this._timer = Meteor.setInterval(async () => {
			await this._updateActiveSessions();
		}, this._monitorTime);
	}

	_handleOnConnection() {
		if (this.isRunning()) {
			return;
		}

		Meteor.onConnection((connection) => {
			if (!this.isRunning()) {
				return;
			}
			// this._handleSession(connection, getDateObj());

			connection.onClose(async () => {
				await Sessions.closeByInstanceIdAndSessionId(this._instanceId, connection.id);
			});
		});
	}

	_handleAccountEvents() {
		if (this.isRunning()) {
			return;
		}

		Accounts.onLogin(async (info) => {
			if (!this.isRunning()) {
				return;
			}

			const { roles, _id: userId } = info.user;

			const mostImportantRole = getMostImportantRole(roles);

			const loginAt = new Date();
			const params = { userId, roles, mostImportantRole, loginAt, ...getDateObj() };
			await this._handleSession(info.connection, params);
			this._updateConnectionInfo(info.connection.id, { loginAt });
		});

		Accounts.onLogout(async (info) => {
			if (!this.isRunning()) {
				return;
			}

			const sessionId = info.connection.id;
			if (info.user) {
				const userId = info.user._id;
				await Sessions.logoutByInstanceIdAndSessionIdAndUserId(this._instanceId, sessionId, userId);
			}
		});
	}

	async _handleSession(connection, params) {
		const data = this._getConnectionInfo(connection, params);
		await Sessions.createOrUpdate(data);
	}

	async _updateActiveSessions() {
		if (!this.isRunning()) {
			return;
		}

		const { year, month, day } = this._today;
		const currentDateTime = new Date();
		const currentDay = getDateObj(currentDateTime);

		if (!isSameDateObj(this._today, currentDay)) {
			const beforeDateTime = new Date(this._today.year, this._today.month - 1, this._today.day, 23, 59, 59, 999);
			const nextDateTime = new Date(currentDay.year, currentDay.month - 1, currentDay.day);

			const createSessions = async (objects, ids) => {
				await Sessions.createBatch(objects);

				Meteor.defer(() => {
					Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, ids, { lastActivityAt: beforeDateTime });
				});
			};
			this._applyAllServerSessionsBatch(createSessions, { createdAt: nextDateTime, lastActivityAt: nextDateTime, ...currentDay });
			this._today = currentDay;
			return;
		}

		// Otherwise, just update the lastActivityAt field
		await this._applyAllServerSessionsIds(async (sessions) => {
			await Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, sessions, { lastActivityAt: currentDateTime });
		});
	}

	_getConnectionInfo(connection, params = {}) {
		if (!connection) {
			return;
		}

		const ip = connection.httpHeaders ? connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] : connection.clientAddress;
		const host = connection.httpHeaders && connection.httpHeaders.host;
		const info = {
			type: 'session',
			sessionId: connection.id,
			instanceId: this._instanceId,
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
					info.longVersion += ` ${ result.app.bundle }`;
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

	async _initActiveServerSessions() {
		await this._applyAllServerSessions(async (connectionHandle) => {
			await this._handleSession(connectionHandle, getDateObj());
		});
	}

	async _applyAllServerSessions(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const sessions = Object.values(Meteor.server.sessions).filter((session) => session.userId);
		for await (const session of sessions) {
			await callback(session.connectionHandle);
		}
	}

	async recursive(callback, sessionIds) {
		await callback(sessionIds.splice(0, 500));

		if (sessionIds.length) {
			await this.recursive(callback, sessionIds);
		}
	}

	async _applyAllServerSessionsIds(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const sessionIds = Object.values(Meteor.server.sessions).filter((session) => session.userId).map((s) => s.id);
		await this.recursive(callback, sessionIds);
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

	_applyAllServerSessionsBatch(callback, params) {
		const batch = (arr, limit) => {
			if (!arr.length) {
				return Promise.resolve();
			}
			const ids = [];
			return Promise.all(arr.splice(0, limit).map((item) => {
				ids.push(item.id);
				return this._getConnectionInfo(item.connectionHandle, params);
			})).then(async (data) => {
				await callback(data, ids);
				return batch(arr, limit);
			}).catch((e) => {
				logger.debug(`Error: ${ e.message }`);
			});
		};

		const sessions = Object.values(Meteor.server.sessions).filter((session) => session.userId);
		batch(sessions, 500);
	}

	_startAggregation() {
		logger.info('[aggregate] - Start Cron.');

		SyncedCron.add({
			name: this._jobName,
			schedule: (parser) => parser.text('at 2:00 am'),
			job: async () => {
				await this.aggregate();
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
			record._id = `${ record.userId }-${ record.year }-${ record.month }-${ record.day }`;
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
