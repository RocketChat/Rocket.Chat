import SlackAdapter from './SlackAdapter.js';
import RocketAdapter from './RocketAdapter.js';
import { logger } from './logger';
import { settings } from '../../settings';

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridgeClass {
	constructor() {
		this.slackAdapters = [];
		this.rocket = new RocketAdapter(this);
		this.reactionsMap = new Map();	// Sync object between rocket and slack

		this.connected = false;
		this.rocket.clearSlackAdapters();

		// Settings that we cache versus looking up at runtime
		this.apiTokens = false;
		this.aliasFormat = '';
		this.excludeBotnames = '';
		this.isReactionsEnabled = true;

		this.processSettings();
	}

	connect() {
		if (this.connected === false) {
			this.slackAdapters = [];
			this.rocket.clearSlackAdapters();

			const tokenList = this.apiTokens.split('\n');
			tokenList.forEach((apiToken) => {
				const slack = new SlackAdapter(this);
				slack.setRocket(this.rocket);
				this.rocket.addSlack(slack);
				this.slackAdapters.push(slack);

				slack.connect(apiToken);
			});

			if (settings.get('SlackBridge_Out_Enabled')) {
				this.rocket.connect();
			}

			this.connected = true;
			logger.connection.info('Enabled');
		}
	}

	disconnect() {
		if (this.connected === true) {
			this.rocket.disconnect();
			this.slackAdapters.forEach((slack) => {
				slack.disconnect();
			});
			this.slackAdapters = [];
			this.connected = false;
			logger.connection.info('Disabled');
		}
	}

	processSettings() {
		// Slack installation API token
		settings.get('SlackBridge_APIToken', (key, value) => {
			if (value !== this.apiTokens) {
				this.apiTokens = value;
				if (this.connected) {
					this.disconnect();
					this.connect();
				}
			}

			logger.class.debug(`Setting: ${ key }`, value);
		});

		// Import messages from Slack with an alias; %s is replaced by the username of the user. If empty, no alias will be used.
		settings.get('SlackBridge_AliasFormat', (key, value) => {
			this.aliasFormat = value;
			logger.class.debug(`Setting: ${ key }`, value);
		});

		// Do not propagate messages from bots whose name matches the regular expression above. If left empty, all messages from bots will be propagated.
		settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
			this.excludeBotnames = value;
			logger.class.debug(`Setting: ${ key }`, value);
		});

		// Reactions
		settings.get('SlackBridge_Reactions_Enabled', (key, value) => {
			this.isReactionsEnabled = value;
			logger.class.debug(`Setting: ${ key }`, value);
		});

		// Is this entire SlackBridge enabled
		settings.get('SlackBridge_Enabled', (key, value) => {
			if (value && this.apiTokens) {
				this.connect();
			} else {
				this.disconnect();
			}
			logger.class.debug(`Setting: ${ key }`, value);
		});
	}
}

export const SlackBridge = new SlackBridgeClass;
