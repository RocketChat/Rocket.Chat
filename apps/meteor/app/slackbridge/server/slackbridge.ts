import { debounce } from 'lodash';

import RocketAdapter from './RocketAdapter';
import SlackAdapter from './SlackAdapter';
import { classLogger, connLogger } from './logger';
import { settings } from '../../settings/server';

interface AppCredential {
	botToken: string;
	appToken: string;
	signingSecret: string;
}

class SlackBridgeClass {
	isEnabled: boolean;

	isLegacyRTM: boolean;

	slackAdapters: SlackAdapter[];

	rocket: RocketAdapter;

	reactionsMap: Map<string, unknown>;

	connected: boolean;

	apiTokens: string;

	botTokens: string;

	appTokens: string;

	signingSecrets: string;

	aliasFormat: string;

	excludeBotnames: string;

	isReactionsEnabled: boolean;

	constructor() {
		this.isEnabled = false;
		this.isLegacyRTM = true;
		this.slackAdapters = [];
		this.rocket = new RocketAdapter(this);
		this.reactionsMap = new Map();

		this.connected = false;
		this.rocket.clearSlackAdapters();

		this.apiTokens = '';
		this.botTokens = '';
		this.appTokens = '';
		this.signingSecrets = '';
		this.aliasFormat = '';
		this.excludeBotnames = '';
		this.isReactionsEnabled = true;

		this.processSettings();
	}

	connect(): void {
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

					slack.connect({ apiToken }).catch((err) => connLogger.error({ msg: 'error connecting to slack', err }));
				});
			} else {
				const botTokenList = this.botTokens.split('\n');
				const appTokenList = this.appTokens.split('\n');
				const signingSecretList = this.signingSecrets.split('\n');

				if (botTokenList.length !== appTokenList.length || botTokenList.length !== signingSecretList.length) {
					connLogger.error('error connecting to slack: number of tokens are not the same');
					return;
				}

				const appCredentials: AppCredential[] = botTokenList.map((botToken, i) => ({
					botToken,
					appToken: appTokenList[i],
					signingSecret: signingSecretList[i],
				}));

				appCredentials.forEach((appCredential) => {
					const slack = new SlackAdapter(this);
					slack.setRocket(this.rocket);
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

	async reconnect(): Promise<void> {
		await this.disconnect();
		if (this.isLegacyRTM && this.apiTokens) {
			this.connect();
		} else if (!this.isLegacyRTM && this.botTokens && this.appTokens && this.signingSecrets) {
			this.connect();
		}
	}

	debouncedReconnectIfEnabled = debounce(() => {
		if (this.isEnabled) {
			this.reconnect();
		}
	}, 500);

	async disconnect(): Promise<void> {
		try {
			if (this.connected === true) {
				await this.rocket.disconnect();
				await Promise.all(this.slackAdapters.map((slack) => slack.disconnect()));
				this.slackAdapters = [];
				this.connected = false;
				connLogger.info('Slack Bridge Disconnected');
			}
		} catch (error) {
			connLogger.error({ msg: 'An error occurred during disconnection', err: error });
		}
	}

	processSettings(): void {
		settings.watch('SlackBridge_UseLegacy', (value: boolean) => {
			if (value !== this.isLegacyRTM) {
				this.isLegacyRTM = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_UseLegacy', value });
		});

		settings.watch('SlackBridge_BotToken', (value: string) => {
			if (value !== this.botTokens) {
				this.botTokens = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_BotToken', value });
		});

		settings.watch('SlackBridge_AppToken', (value: string) => {
			if (value !== this.appTokens) {
				this.appTokens = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_AppToken', value });
		});

		settings.watch('SlackBridge_SigningSecret', (value: string) => {
			if (value !== this.signingSecrets) {
				this.signingSecrets = value;
				this.debouncedReconnectIfEnabled();
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_SigningSecret', value });
		});

		settings.watch('SlackBridge_APIToken', (value: string) => {
			if (value !== this.apiTokens) {
				this.apiTokens = value;
				this.debouncedReconnectIfEnabled();
			}

			classLogger.debug({ msg: 'Setting: SlackBridge_APIToken', value });
		});

		settings.watch('SlackBridge_AliasFormat', (value: string) => {
			this.aliasFormat = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_AliasFormat', value });
		});

		settings.watch('SlackBridge_ExcludeBotnames', (value: string) => {
			this.excludeBotnames = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_ExcludeBotnames', value });
		});

		settings.watch('SlackBridge_Reactions_Enabled', (value: boolean) => {
			this.isReactionsEnabled = value;
			classLogger.debug({ msg: 'Setting: SlackBridge_Reactions_Enabled', value });
		});

		settings.watch('SlackBridge_Enabled', (value: boolean) => {
			if (this.isEnabled !== value) {
				this.isEnabled = value;
				if (this.isEnabled) {
					this.debouncedReconnectIfEnabled();
				} else {
					this.disconnect();
				}
			}
			classLogger.debug({ msg: 'Setting: SlackBridge_Enabled', value });
		});
	}
}

export const SlackBridge = new SlackBridgeClass();
