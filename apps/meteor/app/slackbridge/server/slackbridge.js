import { settings } from '../../settings/server';
import RocketAdapter from './RocketAdapter.js';
import SlackAdapter from './SlackAdapter.js';
import { classLogger, connLogger } from './logger';

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridgeClass {
	constructor() {
		this.isLegacyRTM = true;
		this.slackAdapters = [];
		this.rocket = new RocketAdapter(this);
		this.reactionsMap = new Map(); // Sync object between rocket and slack

		this.connected = false;
		this.rocket.clearSlackAdapters();

		// Settings that we cache versus looking up at runtime
		this.apiTokens = false;
		this.botTokens = false;
		this.appTokens = false;
		this.signingSecrets = false;
		this.aliasFormat = '';
		this.excludeBotnames = '';
		this.isReactionsEnabled = true;

		this.processSettings();
	}

	connect() {
		if (this.connected === false) {
			this.slackAdapters = [];
			this.rocket.clearSlackAdapters();

			if (this.isLegacyRTM) {
				const tokenList = this.apiTokens.split('\n');

				tokenList.forEach((apiToken) => {
					const slack = new SlackAdapter(this);
					slack.setRocket(this.rocket);
					this.rocket.addSlack(slack);
					this.slackAdapters.push(slack);

					slack.connectLegacy(apiToken).catch((err) => connLogger.error('error connecting to slack', err));
				});
			} else {
				const botTokenList = this.botTokens.split('\n'); // Bot token list
				const appTokenList = this.appTokens.split('\n'); // App token list
				const signingSecretList = this.signingSecrets.split('\n'); // Signing secret list

				// Check if the number of tokens are the same
				if (botTokenList.length !== appTokenList.length || botTokenList.length !== signingSecretList.length) {
					connLogger.error('error connecting to slack: number of tokens are not the same');
					return;
				}

				const appCredentials = botTokenList.map((botToken, i) => ({
					botToken,
					appToken: appTokenList[i],
					signingSecret: signingSecretList[i],
				}));

				appCredentials.forEach((appCredential) => {
					const slack = new SlackAdapter(this);
					slack.setRocket(this.rocket);
					this.rocket.addSlack(slack);
					this.slackAdapters.push(slack);

					slack.connect(appCredential).catch((err) => connLogger.error('error connecting to slack', err));
				});
			}

			if (settings.get('SlackBridge_Out_Enabled')) {
				this.rocket.connect();
			}

			this.connected = true;
			connLogger.info('Enabled');
		}
	}

	async reconnect() {
		if (this.connected === true) {
			this.disconnect();
		}
		// connect if either apiTokens or appCredentials are set
		if (this.isLegacyRTM && this.apiTokens) {
			await this.connect();
		} else if (!this.isLegacyRTM && this.botTokens && this.appTokens && this.signingSecrets) {
			await this.connect();
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
		// Check if legacy realtime api is enabled
		settings.watch('SlackBridge_UseLegacy', (value) => {
			if (value !== this.isLegacyRTM) {
				this.isLegacyRTM = value;
				this.reconnect();
			}
			classLogger.debug('Setting: SlackBridge_UseLegacy', value);
		});

		// Slack installtion Bot token
		settings.watch('SlackBridge_BotToken', (value) => {
			if (value !== this.botTokens) {
				this.botTokens = value;
				this.reconnect();
			}
			classLogger.debug('Setting: SlackBridge_BotToken', value);
		});
		// Slack installtion App token
		settings.watch('SlackBridge_AppToken', (value) => {
			if (value !== this.appTokens) {
				this.appTokens = value;
				this.reconnect();
			}
			classLogger.debug('Setting: SlackBridge_AppToken', value);
		});
		// Slack installtion Signing token
		settings.watch('SlackBridge_SigningSecret', (value) => {
			if (value !== this.signingSecrets) {
				this.signingSecrets = value;
				this.reconnect();
			}
			classLogger.debug('Setting: SlackBridge_SigningSecret', value);
		});

		// Slack installation API token
		settings.watch('SlackBridge_APIToken', (value) => {
			if (value !== this.apiTokens) {
				this.apiTokens = value;
				this.reconnect();
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
			if (value) {
				this.reconnect();
			} else {
				this.disconnect();
			}
			classLogger.debug('Setting: SlackBridge_Enabled', value);
		});
	}
}

export const SlackBridge = new SlackBridgeClass();
