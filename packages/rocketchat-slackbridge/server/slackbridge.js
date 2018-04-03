/* globals logger */

import SlackAdapter from './SlackAdapter.js';
import RocketAdapter from './RocketAdapter.js';

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridge {

	constructor() {
		this.slack = new SlackAdapter(this);
		this.rocket = new RocketAdapter(this);
		this.reactionsMap = new Map();	//Sync object between rocket and slack

		this.connected = false;
		this.rocket.setSlack(this.slack);
		this.slack.setRocket(this.rocket);

		this.processSettings();
	}

	connect() {
		if (this.connected === false) {

			this.slack.connect(this.apiToken);
			if (RocketChat.settings.get('SlackBridge_Out_Enabled')) {
				this.rocket.connect();
			}

			this.connected = true;
			logger.connection.info('Enabled');
		}
	}

	disconnect() {
		if (this.connected === true) {
			this.rocket.disconnect();
			this.slack.disconnect();
			this.connected = false;
			logger.connection.info('Disabled');
		}
	}

	processSettings() {
		//Slack installation API token
		RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
			if (value !== this.apiToken) {
				this.apiToken = value;
				if (this.connected) {
					this.disconnect();
					this.connect();
				}
			}

			logger.class.debug(`Setting: ${ key }`, value);
		});

		//Import messages from Slack with an alias; %s is replaced by the username of the user. If empty, no alias will be used.
		RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
			this.aliasFormat = value;
			logger.class.debug(`Setting: ${ key }`, value);
		});

		//Do not propagate messages from bots whose name matches the regular expression above. If left empty, all messages from bots will be propagated.
		RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
			this.excludeBotnames = value;
			logger.class.debug(`Setting: ${ key }`, value);
		});

		//Choose whether SlackBridge should also send your messages back to Slack
		RocketChat.settings.get('SlackBridge_Out_Enabled', (key, value) => {
			logger.class.debug(`Setting: ${ key }`, value);
		});

		//Send messages from all channels that exist in Slack and the bot has joined
		RocketChat.settings.get('SlackBridge_Out_All', (key, value) => {
			logger.class.debug(`Setting: ${ key }`, value);
		});

		//Choose which channels will send messages back to Slack
		RocketChat.settings.get('SlackBridge_Out_Channels', (key, value) => {
			logger.class.debug(`Setting: ${ key }`, value);
		});


		//Is this entire SlackBridge enabled
		RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
			if (value && this.apiToken) {
				this.connect();
			} else {
				this.disconnect();
			}
			logger.class.debug(`Setting: ${ key }`, value);
		});
	}
}

RocketChat.SlackBridge = new SlackBridge;
