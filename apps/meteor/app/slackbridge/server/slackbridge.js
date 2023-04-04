import SlackAdapter from './SlackAdapter.js';
import RocketAdapter from './RocketAdapter.js';
import { classLogger, connLogger } from './logger';
import { settings } from '../../settings/server';

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridgeClass {
	constructor() {
		this.slackAdapters = [];
		this.rocket = new RocketAdapter(this);
		this.reactionsMap = new Map(); // Sync object between rocket and slack

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

				slack.connect(apiToken).catch((err) => connLogger.error('error connecting to slack', err));
			});

			if (settings.get('SlackBridge_Out_Enabled')) {
				this.rocket.connect();
			}

			this.connected = true;
			connLogger.info('Enabled');
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
			connLogger.info('Disabled');
		}
	}

	processSettings() {
		// Slack installation API token
		settings.watch('SlackBridge_APIToken', (value) => {
			if (value !== this.apiTokens) {
				this.apiTokens = value;
				if (this.connected) {
					this.disconnect();
					this.connect();
				}
			}

			classLogger.debug('Setting: SlackBridge_APIToken', value);
		});

		// Import messages from Slack with an alias; %s is replaced by the username of the user. If empty, no alias will be used.
		settings.watch('SlackBridge_AliasFormat', (value) => {
			this.aliasFormat = value;
			classLogger.debug('Setting: SlackBridge_AliasFormat', value);
		});

		// Do not propagate messages from bots whose name matches the regular expression above. If left empty, all messages from bots will be propagated.
		settings.watch('SlackBridge_ExcludeBotnames', (value) => {
			this.excludeBotnames = value;
			classLogger.debug('Setting: SlackBridge_ExcludeBotnames', value);
		});

		// Reactions
		settings.watch('SlackBridge_Reactions_Enabled', (value) => {
			this.isReactionsEnabled = value;
			classLogger.debug('Setting: SlackBridge_Reactions_Enabled', value);
		});

		// Is this entire SlackBridge enabled
		settings.watch('SlackBridge_Enabled', (value) => {
			if (value && this.apiTokens) {
				this.connect();
			} else {
				this.disconnect();
			}
			classLogger.debug('Setting: SlackBridge_Enabled', value);
		});
	}
}

export const SlackBridge = new SlackBridgeClass();
