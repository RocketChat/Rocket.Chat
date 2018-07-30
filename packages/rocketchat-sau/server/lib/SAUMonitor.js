import UAParser from 'ua-parser-js';
import { UAParserMobile } from './UAParserMobile';

const removeEmptyProps = obj => {
	Object.keys(obj).forEach(p => (!obj[p] || obj[p] === undefined) && delete obj[p]);
	return obj;
};

const getDateObj = () => {
	const date = new Date();
	return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
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
		this._monitorTime = 10000;
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
			const params = { userId, loginAt: new Date(), ...getDateObj() };
			this._handleSession(info.connection, params);
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

		const currentDay = getDateObj();
		const { year, month, day } = this._today;

		if (JSON.stringify(this._today) !== JSON.stringify(currentDay)) {
			const beforeDate = this._today;
			const beforeDateTime = new Date(beforeDate.year, beforeDate.month-1, beforeDate.day, 23, 59, 59, 999);
			const nextDateTime = new Date(currentDay.year, currentDay.month-1, currentDay.day, 0, 0, 0, 0);

			this._log(`${ this._serviceName } - Migrating sessions..`);
			console.log('e ai');
			this._applyAllServerSessionsIds(sessions => {

				new Promise((resolve, reject) => {
					try {
						console.log('promisse 1');
						const upsert = RocketChat.models.Sessions.cloneSessionsToDate(beforeDate, currentDay, this._instanceId, sessions, { createdAt: nextDateTime, lastActivityAt: nextDateTime });
						console.log('promisse 2');
						resolve(upsert);
					} catch (e) {
						reject(e);
					}
				}).then(result => {
					console.log('agora caindo aqui...', result);
					Meteor.defer(() => {
						console.log('3');
						this._log(`${ this._serviceName } - Updating sessions..`);
						const update = RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, sessions, { lastActivityAt: beforeDateTime });
						this._log(`${ this._serviceName } - updated sessions: ${ update }`);
					});

				}).catch(() => {

				});
				/*
				try {

				} catch (err) {
					this._log(`${ this._serviceName } - Error recreating sessions.`);
					logger.debug(`[_updateActiveSessions] - ${ err }`);
				}

				console.log('2');
				*/
			});
			console.log('e aqui');
			this._today = currentDay;
		} else {
			//Otherwise, just update the lastActivityAt field
			this._applyAllServerSessionsIds(sessions => {
				this._log(`${ this._serviceName } - Updating sessions..`);
				const update = RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, 	this._instanceId, sessions, { lastActivityAt: new Date() });
				this._log(`${ this._serviceName } - Sessions updated(${ update }).`);
			});
		}
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

}
