import UAParser from 'ua-parser-js';

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
class SAUMonitor {
	constructor() {
		this.serviceName = 'SAUMonitor';
		this.started = false;
		this.activeSessionIds = [];
		this.debug = false;
		this.timeMonitor = 15000;
		this.timer = null;
		this.currentDay = this.getFormattedDate();
	}

	start() {
		if (this.started) {
			return;
		}

		if (typeof this.timeMonitor !== 'number' || this.timeMonitor <= 0) {
			this.log(`${ this.serviceName } ' - SAUMonitor - Error starting monitor'`); //TODO: display timeMonitor error
			return;
		}

		this.log(`${ this.serviceName } ' - Starting...'`); //TODO: Improve starting message..
		//start session control
		this.startMonitoring(() => {
			this.started = true;
			this.log(`${ this.serviceName } ' - Started.'`); //TODO: Improve started message..
		});
	}

	stop() {
		if (!this.started) {
			return;
		}

		this.started = false;

		if (this.timer) {
			Meteor.clearInterval(this.timer);
		}

		this.activeSessionIds = [];
		this.log(`${ this.serviceName } ' - Stopped.'`); //TODO: Improve stopped message..
	}
	/*
	isRunning() {
		return this.started;
	}
	*/
	log() {
		if (this.debug === true) {
			console.log.apply(console, arguments);
		}
	}

	async startMonitoring(callback) {
		try {
			await this.handleOnConnection();
			await this.handleAccountEvents();
			await this.startSessionControl();
			if (callback) {
				callback();
			}
		} catch (err) {
			throw new Meteor.Error(err);
		}
	}

	startSessionControl() {
		if (this.started) {
			return;
		}

		this.activeSessionIds = this.getActiveServerSessionIDs();

		this.timer = Meteor.setInterval(() => {
			this.updateActiveSessions();
		}, this.timeMonitor);
	}

	handleOnConnection() {
		if (this.started) {
			return;
		}

		Meteor.onConnection(connection => {
			const data = this.getConnectionInfo(connection, this.getDate());
			RocketChat.models.Sessions.createOrUpdate(data);
			this.handleSession(connection.id);

			connection.onClose(() => {
				this.log(`${ this.serviceName } ' - Closing session: ' ${ connection.id }`); //TODO: Improve starting message..
				this.activeSessionIds.splice(connection.id, 1);
				RocketChat.models.Sessions.updateBySessionIds([connection.id], { closeAt: new Date() });
			});
		});
	}

	handleAccountEvents() {
		if (this.started) {
			return;
		}

		Accounts.onLogin(info => {
			this.log(`${ this.serviceName } ' - Login session: ' ${ info.user._id }`); //TODO: Login starting message..
			const userId = info.user._id;
			const params = { userId, loginAt: new Date(), ...this.getDate() };
			const data = this.getConnectionInfo(info.connection, params);

			const result = RocketChat.models.Sessions.createOrUpdate(data);
			if (result && result.insertedId) {
				this.handleSession(info.connection.id);
			}
		});

		Accounts.onLogout(info => {
			this.log(`${ this.serviceName } ' - Logout session: ' ${ info.user._id }`); //TODO: Improve Logout message..
			const sessionId = info.connection.id;
			const userId = info.user._id;
			RocketChat.models.Sessions.updateBySessionIdAndUserId(sessionId, userId, { logoutAt: new Date() });
		});
	}

	handleSession(sessionId) {
		//This approach aim to avoid mapping the entire Meteor.server.sessions object only to get the session Ids
		this.log(`${ this.serviceName } ' - handleSession: ' ${ sessionId }`); //TODO: Improve stopped message..
		this.activeSessionIds.push(sessionId);
	}

	updateActiveSessions() {
		if (!this.started) {
			return;
		}

		if (this.activeSessionIds && this.activeSessionIds.length > 0) {
			const currentDay = this.getFormattedDate();
			if (this.currentDay !== currentDay) {
				this.currentDay = currentDay;
				//TODO: When the current day is changed, it's necessary to update the last activities of the sessions on previous day(23:59:59)
				//TODO: and then, it's necessary to recreate the current sessions basead on Meteor.server.sessions, because the struture of the document needs to be recreated
			} else {
				//Otherwise, just update the lastActivityAt field
				Meteor.defer(() => {
					//TODO: If the array is large, it may be best to use batches..
					this.log(`${ this.serviceName } ' - Updating sessions...`); //TODO: Improve updating message..
					const update = RocketChat.models.Sessions.updateBySessionIds(this.activeSessionIds, { lastActivityAt: new Date() });
					this.log(`${ this.serviceName } ' - Sessions updated: ${ update }`); //TODO: Improve updating message..
				});
			}
		}
	}

	getConnectionInfo(connection, params = {}) {
		const ip = connection.httpHeaders ? connection.httpHeaders['x-real-ip'] || connection.httpHeaders['x-forwarded-for'] : connection.clientAddress;
		const host = connection.httpHeaders && connection.httpHeaders.host;
		const info = {
			sessionId: connection.id,
			ip,
			host,
			...this.getUserAgentInfo(connection),
			...params
		};

		return info;
	}

	getUserAgentInfo(connection) {
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
			info.browser = result.browser;
		}

		if (result.os.name) {
			info.os = result.os;
		}

		if (result.device.type || result.device.model) {
			info.device = result.device;
		}

		return info;
	}

	getDate() {
		const today = new Date();
		return {
			day: today.getUTCDate(),
			month: today.getUTCMonth() + 1,
			year: today.getUTCFullYear()
		};
	}

	getActiveServerSessionIDs() {
		const sessions = Object.values(Meteor.server.sessions);
		const sessionIds = sessions.map(session => session.id);

		return sessionIds;
	}

	getFormattedDate() {
		const { day, month, year } = this.getDate();
		return `${ year }/${ month }/${ day }`;
	}
}

RocketChat.SAUMonitor = new SAUMonitor();

Meteor.startup(() => {
	RocketChat.SAUMonitor.debug = true;
	RocketChat.SAUMonitor.start();
});
