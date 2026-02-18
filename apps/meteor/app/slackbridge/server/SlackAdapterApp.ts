import { App as SlackApp } from '@slack/bolt';

import { SlackAPI } from './SlackAPI';
import SlackAdapter from './SlackAdapter';
import type { IRocketChatAdapter } from './definition/IRocketChatAdapter';
import type { SlackAppCredentials } from './definition/ISlackAdapter';
import type { ISlackbridge } from './definition/ISlackbridge';
import { slackLogger } from './logger';

export default class SlackAdapterApp extends SlackAdapter {
	private slackApp: SlackApp | null = null;

	private appCredential: SlackAppCredentials | null = null;

	constructor(slackBridge: ISlackbridge, rocket: IRocketChatAdapter) {
		super(slackBridge, rocket);
	}

	/**
	 * Connect to the remote Slack server using the passed in app credential and register for Slack events.
	 */
	async connectApp(appCredential: SlackAppCredentials): Promise<boolean> {
		this.appCredential = appCredential;

		// Invalid app credentials causes unhandled errors
		if (!(await SlackAPI.verifyAppCredentials(appCredential))) {
			throw new Error('Invalid app credentials (botToken or appToken) for the slack app');
		}
		this._slackAPI = new SlackAPI(this.appCredential.botToken);

		this.slackApp = new SlackApp({
			appToken: this.appCredential.appToken,
			signingSecret: this.appCredential.signingSecret,
			token: this.appCredential.botToken,
			socketMode: true,
		});

		this.registerForEvents();

		const connectResult = await this.slackApp.start();
		if (connectResult) {
			slackLogger.info('Connected to Slack');
			slackLogger.debug('Slack connection result: ', connectResult);
		}

		return Boolean(connectResult);
	}

	async connectLegacy(_apiToken: string): Promise<boolean> {
		return false;
	}

	registerForEvents(): void {
		if (!this.slackApp) {
			return;
		}

		/**
		 * message: {
		 * "client_msg_id": "caab144d-41e7-47cc-87fa-af5d50c02784",
		 * "type": "message",
		 * "text": "heyyyyy",
		 * "user": "U060WD4QW81",
		 * "ts": "1697054782.214569",
		 * "blocks": [],
		 * "team": "T060383CUDV",
		 * "channel": "C060HSLQPCN",
		 * "event_ts": "1697054782.214569",
		 * "channel_type": "channel"
		 * }
		 */
		this.slackApp.message(async (event) => {
			const { message } = event;
			slackLogger.debug('OnSlackEvent-MESSAGE: ', message);
			if (message) {
				try {
					await this.onMessage(message);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onMessage', err });
				}
			}
		});

		/**
		 * Event fired when a message is reacted in a channel or group app is added in
		 * event: {
		 * "type": "reaction_added",
		 * "user": "U060WD4QW81",
		 * "reaction": "telephone_receiver",
		 * "item": {
		 *   "type": "message",
		 *   "channel": "C06196XMUMN",
		 *   "ts": "1697037020.309679"
		 * },
		 * "item_user": "U060WD4QW81",
		 * "event_ts": "1697037219.001600"
		 * }
		 */
		this.slackApp.event('reaction_added', async ({ event }) => {
			slackLogger.debug('OnSlackEvent-REACTION_ADDED: ', event);
			try {
				slackLogger.error({ event });
				await this.onReactionAdded(event);
			} catch (err) {
				slackLogger.error({ msg: 'Unhandled error onReactionAdded', err });
			}
		});

		/**
		 * Event fired when a reaction is removed from a message in a channel or group app is added in.
		 * event: {
		 * "type": "reaction_removed",
		 * "user": "U060WD4QW81",
		 * "reaction": "raised_hands",
		 * "item": {
		 *   "type": "message",
		 *   "channel": "C06196XMUMN",
		 *   "ts": "1697028997.057629"
		 * },
		 * "item_user": "U060WD4QW81",
		 * "event_ts": "1697029220.000600"
		 * }
		 */
		this.slackApp.event('reaction_removed', async ({ event }) => {
			slackLogger.debug('OnSlackEvent-REACTION_REMOVED: ', event);
			try {
				await this.onReactionRemoved(event);
			} catch (err) {
				slackLogger.error({ msg: 'Unhandled error onReactionRemoved', err });
			}
		});

		/**
		 * Event fired when a members joins a channel
		 * event: {
		 * "type": "member_joined_channel",
		 * "user": "U06039U8WK1",
		 * "channel": "C060HT033E2",
		 * "channel_type": "C",
		 * "team": "T060383CUDV",
		 * "inviter": "U060WD4QW81",
		 * "event_ts": "1697042377.000800"
		 * }
		 */
		this.slackApp.event('member_joined_channel', async ({ event, context }) => {
			slackLogger.debug('OnSlackEvent-CHANNEL_LEFT: ', event);
			try {
				await this.processMemberJoinChannel(event, context);
			} catch (err) {
				slackLogger.error({ msg: 'Unhandled error onChannelLeft', err });
			}
		});

		this.slackApp.event('channel_left', async ({ event }) => {
			slackLogger.debug('OnSlackEvent-CHANNEL_LEFT: ', event);
			try {
				this.onChannelLeft(event);
			} catch (err) {
				slackLogger.error({ msg: 'Unhandled error onChannelLeft', err });
			}
		});

		this.slackApp.error(async (error) => {
			slackLogger.error({ msg: 'Error on SlackApp', error });
		});
	}

	/**
	 * Unregister for slack events and disconnect from Slack
	 */
	async disconnect() {
		if (this.slackApp?.stop) {
			await this.slackApp.stop();
		}
	}
}
