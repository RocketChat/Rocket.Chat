/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
class SAUMonitor {
	constructor() {
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
			this.log('SAUMonitor - Error starting monitor'); //diplay timeMonitor value
			return;
		}

		this.activeSessionIds = [];
		this.started = true;
		this.log('SAUMonitor - starting..');
		//start session control
		this.startSessionControl();
		this.log('SAUMonitor - started');
	}

	stop() {
		if (!this.started) {
			return;
		}

		this.started = false;

		if (this.timer) {
			Meteor.clearInterval(this.timer);
		}

		//Close sessions..
		this.activeSessionIds = [];
		this.log('SAUMonitor - stopped');
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

	startSessionControl() {
		this.handleOnConnection();
		this.handleAccountEvents();
		this.startMonitoring();
	}

	startMonitoring() {
		if (!this.started) {
			return;
		}

		this.timer = Meteor.setInterval(() => {
			this.updateActiveSessions();
		}, this.timeMonitor);
	}

	handleOnConnection() {
		Meteor.onConnection(connection => {
			const data = this.getConnectionInfo(connection, this.getDate());
			console.log('conn data');
			console.log(data);
			RocketChat.models.Sessions.createOrUpdate(data);
			this.handleSession(connection.id);

			connection.onClose(() => {
				this.log('close connection: ', connection.id);
				this.activeSessionIds.splice(connection.id, 1);
				this.log('sessionIds', this.activeSessionIds);
				/*
				if (connection.httpHeaders['user-agent']) {
					const ua = new UAParser();
					ua.setUA(connection.httpHeaders['user-agent']);

					const connectionData = connection;
					connectionData.result = ua.getResult();
					console.log('connectionData');
					console.log(connectionData);
				}*/
			});
		});
	}

	handleAccountEvents() {
		Accounts.onLogin(info => {
			const userId = info.user._id;
			const params = { userId, ...this.getDate() };
			const data = this.getConnectionInfo(info.connection, params);

			const result = RocketChat.models.Sessions.createOrUpdate(data);
			if (result && result.insertedId) {
				this.handleSession(info.connection.id);
			}
		});

		Accounts.onLogout(info => {
			const sessionId = info.connection.id;
			const userId = info.user._id;
			RocketChat.models.Sessions.updateBySessionIdAndUserId(sessionId, userId, { logoutAt: new Date() });
		});
	}

	handleSession(sessionId) {
		//analisar remover o array e extrair o id da sessao de meteor.server.sessions
		this.activeSessionIds.push(sessionId);
	}

	updateActiveSessions() {
		this.log('updating connections..');
		if (!this.started) {
			return;
		}

		if (this.activeSessionIds && this.activeSessionIds.length > 0) {
			const currentDay = this.getFormattedDate();
			if (this.currentDay !== currentDay) {
				this.currentDay = currentDay;
				//necessario recriar todas as sessions em Meteor.server.sessions
			} else {
				//do contrario, apenas atualiza o DB
				RocketChat.models.Sessions.updateActivityBySessionIds(this.activeSessionIds);
			}
		}

		this.log('connections updated');
	}

	getConnectionInfo(connection, params = {}) {
		const { clientAddress, httpHeaders } = connection;

		const info = {
			sessionId: connection.id,
			clientAddress,
			httpHeaders,
			...params
		};

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
