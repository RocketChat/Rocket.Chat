import UAParser from 'ua-parser-js';
import { BucketStorage } from './BucketStorage';
import { UAParserMobile } from './UAParserMobile';

const removeEmptyProps = obj => {
	Object.keys(obj).forEach(p => (!obj[p] || obj[p] === undefined) && delete obj[p]);
	return obj;
};

const getDateObj = () => {
	const date = new Date();
	return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
};

const logger = new Logger('SAUMonitor');

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitor {
	constructor() {
		this._serviceName = 'SAUMonitor';
		this._started = false;
		this.storage = new BucketStorage();
		this._debug = false;
		this._timeMonitor = 60000;
		this._timer = null;
		this._monitorDay = getDateObj();
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
			Meteor.clearInterval(this.timer);
		}

		this.storage.clear();
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
		if (!mode || typeof mode !== 'boolean') {
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

		if (this._timeMonitor < 0) {
			return;
		}

		this._timer = Meteor.setInterval(() => {
			this._updateActiveSessions();
		}, this._timeMonitor);
	}

	_handleOnConnection() {
		if (this.isRunning()) {
			return;
		}

		Meteor.onConnection(connection => {
			this._handleSession(connection, getDateObj());

			connection.onClose(() => {
				const closeTime = new Date();
				this._log(`${ this._serviceName } - Closing connection = ${ connection.id }`);
				RocketChat.models.Sessions.updateByInstanceIdAndSessionId(this._instanceId, connection.id, { closedAt: closeTime, lastActivityAt: closeTime });
				if (!this.storage.remove(connection.id, connection.storeId)) {
					logger.debug(`[connection.onClose] - Connection not found: ${ connection.id }`);
				}
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
			RocketChat.models.Sessions.updateByInstanceIdAndSessionIdAndUserId(this._instanceId, sessionId, userId, { logoutAt: new Date() });
		});
	}

	_handleSession(connection, params) {
		const data = this._getConnectionInfo(connection, params);
		const result = RocketChat.models.Sessions.createOrUpdate(data);
		if (result && result.insertedId) {
			const handleId = this.storage.add(data.sessionId);
			if (handleId) {
				this._updateConnectionInfo(data.sessionId, handleId);
			}
		}
	}

	_updateActiveSessions() {
		if (!this.isRunning()) {
			return;
		}

		if (this.storage.count() === 0) {
			return;
		}

		const currentDay = getDateObj();
		const { year, month, day } = this._monitorDay;

		if (JSON.stringify(this._monitorDay) !== JSON.stringify(currentDay)) {
			//When the current day is changed, it's necessary to update the last activities of the sessions on previous day(23:59:59)
			//And then, it's necessary to recreate the current sessions because the struture of the documents need to be recreated
			const beforeDate = this._monitorDay;
			const beforeDateTime = new Date(beforeDate.year, beforeDate.month-1, beforeDate.day, 23, 59, 59, 999);
			const nextDateTime = new Date(currentDay.year, currentDay.month-1, currentDay.day, 0, 0, 0, 0);

			this._log(`${ this._serviceName } - Migrating sessions: ${ this.storage.count() }`);

			this._applyAllStorageSessions(sessions => {
				this._cloneSessionsToDate(beforeDate, currentDay, this._instanceId, sessions, { createdAt: nextDateTime, lastActivityAt: new Date() });

				Meteor.defer(() => {
					this._log(`${ this._serviceName } - updating...`);
					const update = RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, sessions, { lastActivityAt: beforeDateTime/*, closedAt: beforeDateTime*/ });
					this._log(`${ this._serviceName } - updated sessions: ${ update }`);
				});
			});

			this._monitorDay = currentDay;
		} else {
			//Otherwise, just update the lastActivityAt field
			this._applyAllStorageSessions(sessions => {
				Meteor.defer(() => {
					this._log(`${ this._serviceName } - Updating sessions..`);
					const update = RocketChat.models.Sessions.updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day }, this._instanceId, sessions, { lastActivityAt: new Date() });
					this._log(`${ this._serviceName } - Sessions updated(${ update }).`);
				});
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

	_applyAllStorageSessions(callback) {
		if (!callback || typeof callback !== 'function') {
			return;
		}

		this.storage.applyAll(sessions => {
			callback(sessions);
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

	_updateConnectionInfo(sessionId, handleId) {
		if (!sessionId || !handleId) {
			return;
		}
		if (Meteor.server.sessions[sessionId]) {
			Meteor.server.sessions[sessionId].connectionHandle['storeId'] = handleId;
		}
	}

	async _cloneSessionsToDate(from = {}, to = {}, instanceId, sessionIds, data = {}) {
		const { year, month, day } = from;
		const query = {
			instanceId,
			year,
			month,
			day,
			sessionId: { $in: sessionIds }
		};

		const sessionsList = await RocketChat.models.Sessions.find(query).map(doc => {
			const newDoc = Object.assign(doc, data, to);
			delete newDoc._id;
			return newDoc;
		});

		if (sessionsList.length === 0) {
			return;
		}

		const collectionObj = RocketChat.models.Sessions.model.rawCollection();
		try {
			collectionObj.insertMany(sessionsList);
		} catch (err) {
			this._log(`${ this._serviceName } - Error recreating sessions.`);
			logger.debug(`[cloneSessionsToDate] - ${ err }`);
			throw new Meteor.Error(err);
		}

	}

}
