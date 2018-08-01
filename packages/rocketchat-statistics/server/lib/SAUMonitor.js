import UAParser from 'ua-parser-js';
import { UAParserMobile } from './UAParserMobile';

const getDateObj = (dateTime) => {
	if (!dateTime) {
		dateTime = new Date();
	}

	return { day: dateTime.getDate(), month: dateTime.getMonth() + 1, year: dateTime.getFullYear() };
};

const logger = new Logger('SAUMonitor');

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitor {
	constructor() {
		this._serviceName = 'SAUMonitor';
		this._started = false;
		this._debug = false;
		this._monitorTime = 600000;
		this._timer = null;
		this._today = getDateObj();
		this._instanceId = null;
	}

	start(instanceId) {
		if (this.isRunning()) {
			return;
		}

		this._instanceId = instanceId;

		if (!this._instanceId) {
			logger.debug('[start] - InstanceId is not defined.');
			this._log(`${ this._serviceName } - Error starting monitor: InstanceID is not defined.`);
			return;
		}

		this._startMonitoring(() => {
			this._started = true;
			this._log(`${ this._serviceName } - Started: ${ this._instanceId }`);
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

		this.log(`${ this._serviceName } - Stopped.`);
		logger.debug(`[stop] - InstanceId: ${ this._instanceId }`);
	}

	isRunning() {
		return typeof this._started === 'boolean' && this._started === true;
	}

	_log() {
		if (this._debug === true) {
			console.log.apply(console, arguments);
		}
	}

	setDebug(mode) {
		if (typeof mode !== 'boolean') {
			return;
		}

		this._debug = mode;
	}

	async _startMonitoring(callback) {
		try {
			await this._handleAccountEvents();
			await this._handleOnConnection();
			await this._startSessionControl();
			await this._initActiveServerSessions();
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

		this._timer = Meteor.setInterval(() => {
			this._updateActiveSessions();
		}, this._monitorTime);
	}

	_handleOnConnection() {
		if (this.isRunning()) {
			return;
		}

		Meteor.onConnection(connection => {
			this._handleSession(connection, getDateObj());

			connection.onClose(() => {
				RocketChat.models.Sessions.closeByInstanceIdAndSessionId(this._instanceId, connection.id);
			});
		});
	}

	_handleAccountEvents() {
		if (this.isRunning()) {
			return;
		}

		Accounts.onLogin(info => {
			const userId = info.user._id;
			const loginAt = new Date();
			const params = { userId, loginAt, ...getDateObj() };
			this._handleSession(info.connection, params);
			this._updateConnectionInfo(info.connection.id, { loginAt });
		});

		Accounts.onLogout(info => {
			const sessionId = info.connection.id;
			const userId = info.user._id;
			RocketChat.models.Sessions.logoutByInstanceIdAndSessionIdAndUserId(this._instanceId, sessionId, userId);
		});
	}

	_handleSession(connection, params) {
		const data = this._getConnectionInfo(connection, params);
		RocketChat.models.Sessions.createOrUpdate(data);
	}

	_updateActiveSessions() {
		if (!this.isRunning()) {
			return;
		}

		const { year, month, day } = this._today;
		const currentDateTime = new Date();
		const currentDay = getDateObj(currentDateTime);

		if (JSON.stringify(this._today) !== JSON.stringify(currentDay)) {
			const beforeDateTime = new Date(this._today.year, this._today.month-1, this._today.day, 23, 59, 59, 999);
			const nextDateTime = new Date(currentDay.year, currentDay.month-1, currentDay.day, 0, 0, 0, 0);

			const createSessions = ((objects, ids) => {
				RocketChat.models.Sessions.createBatch(objects);

				Meteor.defer(() => {
					RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, ids, { lastActivityAt: beforeDateTime });
				});
			});
			this._applyAllServerSessionBatch(createSessions, { createdAt: nextDateTime, lastActivityAt: nextDateTime, ...currentDay});
			this._today = currentDay;
			return;
		}

		//Otherwise, just update the lastActivityAt field
		this._applyAllServerSessionsIds(sessions => {
			RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, 	this._instanceId, sessions, { lastActivityAt: currentDateTime });
		});
	}

	_getConnectionInfo(connection, params = {}) {
		if (!connection) {
			return;
		}

		const ip = connection.httpHeaders ? connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] : connection.clientAddress;
		const host = connection.httpHeaders && connection.httpHeaders.host;
		const info = {
			sessionId: connection.id,
			instanceId: this._instanceId,
			ip,
			host,
			...this._getUserAgentInfo(connection),
			...params
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
		} else {
			const ua = new UAParser(uaString);
			result = ua.getResult();
		}

		const info = {};

		const removeEmptyProps = obj => {
			Object.keys(obj).forEach(p => (!obj[p] || obj[p] === undefined) && delete obj[p]);
			return obj;
		};

		if (result.browser && result.browser.name) {
			info.browser = removeEmptyProps(result.browser);
		}

		if (result.os && result.os.name) {
			info.os = removeEmptyProps(result.os);
		}

		if (result.device && (result.device.type || result.device.model)) {
			info.device = removeEmptyProps(result.device);
		}

		if (result.app && result.app.name) {
			info.app = removeEmptyProps(result.app);
		}

		return info;
	}

	_initActiveServerSessions() {
		this._applyAllServerSessions(connectionHandle => {
			this._handleSession(connectionHandle, getDateObj());
		});
	}

	_applyAllServerSessions(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const sessions = Object.values(Meteor.server.sessions);
		sessions.forEach(session => {
			callback(session.connectionHandle);
		});
	}

	_applyAllServerSessionsIds(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		const sessions = Object.values(Meteor.server.sessions);
		const sessionIds = sessions.map(s => s.id);
		while (sessionIds.length) {
			callback(sessionIds.splice(0, 500));
		}
	}

	_updateConnectionInfo(sessionId, data = {}) {
		if (!sessionId) {
			return;
		}
		if (Meteor.server.sessions[sessionId]) {
			Object.keys(data).forEach(p => {
				Object.defineProperty(Meteor.server.sessions[sessionId].connectionHandle, p, {
					value: data[p]
				});
			});
		}
	}
	_applyAllServerSessionBatch(callback, params) {
		const self = this;
		const batch = (arr, limit) => {
			if (!arr.length) {
				return Promise.resolve();
			}
			const ids = [];
			return Promise.all(arr.splice(0, limit).map((item) => {
				ids.push(item.id);
				return self._getConnectionInfo(item.connectionHandle, params);
			})).then((data) => {
				callback(data, ids);
				return batch(arr, limit);
			}).catch((e) => {
				logger.debug(`Error: ${ e.message }`);
				this._log(`${ this._serviceName } - Error: ${ e.message }`);
			});
		};

		const sessions = Object.values(Meteor.server.sessions);
		batch(sessions, 500);
	}
}
