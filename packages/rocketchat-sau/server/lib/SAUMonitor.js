import UAParser from 'ua-parser-js';
import { BucketStorage } from './BucketStore';

const removeEmptyProps = obj => {
	Object.keys(obj).forEach(p => (!obj[p] || obj[p] === undefined) && delete obj[p]);
	return obj;
};

const getTodayObj = () => {
	const today = new Date();
	return { day: today.getUTCDate(), month: today.getUTCMonth() + 1, year: today.getUTCFullYear() };
};

const getFormattedDate = () => {
	const { day, month, year } = getTodayObj();
	return `${ year }/${ month }/${ day }`;
};
/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitor {
	constructor() {
		this._serviceName = 'SAUMonitor';
		this._started = false;
		this.storage = new BucketStorage();
		this._debug = false;
		this._timeMonitor = 15000;
		this._timer = null;
		this._currentDay = getFormattedDate();
	}

	start() {
		if (this.isRunning()) {
			return;
		}

		if (typeof this._timeMonitor !== 'number' || this._timeMonitor <= 0) {
			this._log(`${ this._serviceName } ' - SAUMonitor - Error starting monitor'`); //TODO: display timeMonitor error
			return;
		}

		this._log(`${ this._serviceName } ' - Starting...'`); //TODO: Improve starting message..
		//start session control
		const self = this;
		this._startMonitoring(() => {
			self._started = true;
			self._log(`${ this._serviceName } ' - Started.'`); //TODO: Improve started message..
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
		this.log(`${ this._serviceName } ' - Stopped.'`); //TODO: Improve stopped message..
	}

	isRunning() {
		return typeof this._started === 'boolean' && this._started === true;
	}

	_log() {
		if (this._debug === true) {
			console.log.apply(console, arguments);
		}
	}

	setDebugMode(mode) {
		if (typeof this._started !== 'boolean') {
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

		this._timer = Meteor.setInterval(() => {
			this._updateActiveSessions();
		}, this._timeMonitor);
	}

	_handleOnConnection() {
		if (this.isRunning()) {
			return;
		}

		Meteor.onConnection(connection => {
			connection.onClose(() => {
				this.storage.remove(connection.id, connection.storeId);
				RocketChat.models.Sessions.updateBySessionIds([connection.id], { closeAt: new Date() });
			});

			this._handleSession(connection, getTodayObj());
		});
	}

	_handleAccountEvents() {
		if (this.isRunning()) {
			return;
		}

		Accounts.onLogin(info => {
			const userId = info.user._id;
			const params = { userId, loginAt: new Date(), ...getTodayObj() };
			this._handleSession(info.connection, params);
		});

		Accounts.onLogout(info => {
			const sessionId = info.connection.id;
			const userId = info.user._id;
			RocketChat.models.Sessions.updateBySessionIdAndUserId(sessionId, userId, { logoutAt: new Date() });
		});
	}

	_handleSession(connection, params) {
		const data = this._getConnectionInfo(connection, params);
		const result = RocketChat.models.Sessions.createOrUpdate(data);
		if (result && result.insertedId) {
			const handleId = this.storage.add(data.sessionId);
			this._updateConnectionInfo(data.sessionId, handleId);
		}
	}

	_updateActiveSessions() {
		if (!this.isRunning()) {
			return;
		}

		if (this.storage.count() === 0) {
			return;
		}

		const currentDay = getFormattedDate();
		if (this._currentDay !== currentDay) {
			this._currentDay = currentDay;
			//TODO: When the current day is changed, it's necessary to update the last activities of the sessions on previous day(23:59:59)
			//TODO: and then, it's necessary to recreate the current sessions basead on Meteor.server.sessions, because the struture of the document needs to be recreated
		} else {
			//Otherwise, just update the lastActivityAt field
			Meteor.defer(() => {
				this.storage.applyAll(sessions => {
					this._log(`${ this._serviceName } ' - Updating sessions...`); //TODO: Improve updating message..
					console.log(sessions);
					const update = RocketChat.models.Sessions.updateBySessionIds(sessions, { lastActivityAt: new Date() });
					this._log(`${ this._serviceName } ' - Sessions updated: ${ update }`); //TODO: Improve updating message..
				});
			});
		}
	}

	_getConnectionInfo(connection, params = {}) {
		const ip = connection.httpHeaders ? connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] : connection.clientAddress;
		const host = connection.httpHeaders && connection.httpHeaders.host;
		const info = {
			sessionId: connection.id,
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
		//TODO: Create a method to identify user-agent for Rocket.Chat app's and get the correctly data they provide
		const ua = new UAParser();
		ua.setUA(connection.httpHeaders['user-agent']);
		//ua.setUA('RC Mobile, Android 6.0, v2.5.0 (2750)');
		//ua.setUA('RC Mobile Dalvik/2.1.0 (Linux; U; Android 6.0.1; vivo 1610 Build/MMB29M)');
		//<AppName>/<version> Dalvik/<version> (Linux; U; Android <android version>; <device ID> Build/<buildtag>)
		//ua.setUA('RC Mobile iPhone5 iOS 10.1 CFNetwork/808.3 Darwin/16.3.0');
		const result = ua.getResult();
		const info = {};

		if (result.browser.name) {
			info.browser = removeEmptyProps(result.browser);
		}

		if (result.os.name) {
			info.os = removeEmptyProps(result.os);
		}

		if (result.device.type || result.device.model) {
			info.device = removeEmptyProps(result.device);
		}

		return info;
	}

	_initActiveServerSessions() {
		this._log('initiating active server sessions..');
		const sessions = Object.values(Meteor.server.sessions);
		sessions.forEach(session => {
			this._handleSession(session.connectionHandle);
		});
	}

	_updateConnectionInfo(sessionId, handleId) {
		if (Meteor.server.sessions[sessionId]) {
			Meteor.server.sessions[sessionId].connectionHandle['storeId'] = handleId;
		}
	}
}
