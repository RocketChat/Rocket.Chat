import type { IUser } from '@rocket.chat/core-typings';
import { debounce } from 'lodash';

import RocketAdapter from './RocketAdapter';
import SlackAdapter from './SlackAdapter';
import { classLogger, connLogger } from './logger';
import { settings } from '../../settings';

/**
 * SlackBridge interfaces between this Rocket installation and a remote Slack installation.
 */
class SlackBridgeClass {
	isEnabled = false;

	isLegacyRTM = true;

	slackAdapters: SlackAdapter[] = [];

	rocket: RocketAdapter;

	reactionsMap = new Map<string, IUser>(); // Sync object between rocket and slack

	connected = false;

	// Settings that we cache versus looking up at runtime
	apiTokens = '';

	botTokens = '';

	appTokens = '';

	signingSecrets = '';

	aliasFormat = '';

	excludeBotnames = '';

	isReactionsEnabled = true;

	constructor() {
		this.rocket = new RocketAdapter(this);
		this.rocket.clearSlackAdapters();

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
					this.rocket.addSlack(slack);
					this.slackAdapters.push(slack);

					slack.connect({ apiToken }).catch((err) => connLogger.error({ msg: 'error connecting to slack', err }));
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
					this.rocket.addSlack(slack);
					this.slackAdapters.push(slack);

					slack.connect({ appCredential }).catch((err) => connLogger.error({ msg: 'error connecting to slack', err }));
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
		await this.disconnect();
		// connect if either apiTokens or appCredentials are set
		if (this.isLegacyRTM && this.apiTokens) {
			this.connect();
		} else if (!this.isLegacyRTM && this.botTokens && this.appTokens && this.signingSecrets) {
			this.connect();
		}
	}

	debouncedReconnectIfEnabled = debounce(() => {
		if (this.isEnabled) {
			void this.reconnect();
		}
	}, 500);

	async disconnect() {
		try {
			if (this.connected === true) {
				this.rocket.disconnect();
				await Promise.all(this.slackAdapters.map((slack) => slack.disconnect()));
				this.slackAdapters = [];
				this.connected = false;
				connLogger.info('Slack Bridge Disconnected');
			}
		} catch (error) {
			connLogger.error({ msg: 'An error occurred during disconnection', err: error });
		}
	}

	processSettings() {
		// Check if legacy realtime api is enabled
		settings.watch<boolean>('SlackBridge_UseLegacy', (value) => {
			if (value !== this.isLegacyRTM) {
				this.isLegacyRTM = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_UseLegacy', value });
		});

		// Slack installtion Bot token
		settings.watch<string>('SlackBridge_BotToken', (value) => {
			if (value !== this.botTokens) {
				this.botTokens = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_BotToken', value });
		});
		// Slack installtion App token
		settings.watch<string>('SlackBridge_AppToken', (value) => {
			if (value !== this.appTokens) {
				this.appTokens = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_AppToken', value });
		});
		// Slack installtion Signing token
		settings.watch<string>('SlackBridge_SigningSecret', (value) => {
			if (value !== this.signingSecrets) {
				this.signingSecrets = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_SigningSecret', value });
		});

		// Slack installation API token
		settings.watch<string>('SlackBridge_APIToken', (value) => {
			if (value !== this.apiTokens) {
				this.apiTokens = value;
				this.debouncedReconnectIfEnabled();
			}

			classLogger.debug({ msg: 'Setting: SlackBridge_APIToken', value });
		});

		// Import messages from Slack with an alias; %s is replaced by the username of the user. If empty, no alias will be used.
		settings.watch<string>('SlackBridge_AliasFormat', (value) => {
			this.aliasFormat = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_AliasFormat', value });
		});

		// Do not propagate messages from bots whose name matches the regular expression above. If left empty, all messages from bots will be propagated.
		settings.watch<string>('SlackBridge_ExcludeBotnames', (value) => {
			this.excludeBotnames = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_ExcludeBotnames', value });
		});

		// Reactions
		settings.watch<boolean>('SlackBridge_Reactions_Enabled', (value) => {
			this.isReactionsEnabled = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_Reactions_Enabled', value });
		});

		// Is this entire SlackBridge enabled
		settings.watch<boolean>('SlackBridge_Enabled', (value) => {
			if (this.isEnabled !== value) {
				this.isEnabled = value;
				if (this.isEnabled) {
					this.debouncedReconnectIfEnabled();
				} else {
					void this.disconnect();
				}
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_Enabled', value });
		});
	}
}

export type { SlackBridgeClass };

export const SlackBridge = new SlackBridgeClass();
