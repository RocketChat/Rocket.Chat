/* globals logger */

class SlackBridge {
	constructor() {
		this.slackClient = Npm.require('slack-client');
		this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
		this.rtm = {};
		this.connected = false;

		RocketChat.settings.onload('SlackBridge_APIToken', (key, value) => {
			this.apiToken = value;
		});

		RocketChat.settings.onload('SlackBridge_Enabled', (key, value) => {
			if (value) {
				this.connect();
			} else {
				this.disconnect();
			}
		});
	}

	connect() {
		if (!this.connected) {
			this.connected = true;
			logger.connection.info('Connecting via token: ', this.apiToken);
			var RtmClient = this.slackClient.RtmClient;
			this.rtm = new RtmClient(this.apiToken);
			this.rtm.start();
			this.setEvents();
		}
	}

	disconnect() {
		this.rtm.disconnect && this.rtm.disconnect();
		this.connected = false;
		logger.connection.info('Disconnected');
	}

	setEvents() {
		var CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
		this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
			logger.connection.info('Connected');
		});

		this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
			this.disconnect();
		});

		this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
			this.disconnect();
		});

		var RTM_EVENTS = this.slackClient.RTM_EVENTS;

		this.rtm.on(RTM_EVENTS.MESSAGE, (message) => {
			logger.events.info('MESSAGE: ', message);
		});

		this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, (message) => {
			logger.events.info('CHANNEL CREATED: ', message);
		});

		this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, (message) => {
			logger.events.info('CHANNEL JOINED: ', message);
		});

		this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, (message) => {
			logger.events.info('CHANNEL LEFT: ', message);
		});

		this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, (message) => {
			logger.events.info('CHANNEL DELETED: ', message);
		});

		this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, (message) => {
			logger.events.info('CHANNEL RENAME: ', message);
		});

		this.rtm.on(RTM_EVENTS.IM_CREATED, (message) => {
			logger.events.info('IM CREATED: ', message);
		});

		this.rtm.on(RTM_EVENTS.IM_OPEN, (message) => {
			logger.events.info('IM OPEN: ', message);
		});

		this.rtm.on(RTM_EVENTS.IM_CLOSE, (message) => {
			logger.events.info('IM CLOSE: ', message);
		});

		this.rtm.on(RTM_EVENTS.GROUP_JOINED, (message) => {
			logger.events.info('GROUP JOINED: ', message);
		});

		this.rtm.on(RTM_EVENTS.GROUP_LEFT, (message) => {
			logger.events.info('GROUP LEFT: ', message);
		});

		this.rtm.on(RTM_EVENTS.GROUP_OPEN, (message) => {
			logger.events.info('GROUP OPEN: ', message);
		});

		this.rtm.on(RTM_EVENTS.GROUP_CLOSE, (message) => {
			logger.events.info('GROUP CLOSE: ', message);
		});

		this.rtm.on(RTM_EVENTS.GROUP_RENAME, (message) => {
			logger.events.info('GROUP RENAME: ', message);
		});

		this.rtm.on(RTM_EVENTS.TEAM_JOIN, (message) => {
			logger.events.info('TEAM JOIN: ', message);
		});
	}
}

RocketChat.SlackBridge = new SlackBridge;
