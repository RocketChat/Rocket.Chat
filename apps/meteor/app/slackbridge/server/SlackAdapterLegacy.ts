import { RTMClient } from '@slack/rtm-api';

import { SlackAPI } from './SlackAPI';
import SlackAdapter from './SlackAdapter';
import type { IRocketChatAdapter } from './definition/IRocketChatAdapter';
import type { SlackAppCredentials } from './definition/ISlackAdapter';
import type { ISlackbridge } from './definition/ISlackbridge';
import { slackLogger } from './logger';

/**
 * @deprecated
 */
export default class SlackAdapterLegacy extends SlackAdapter {
	// Slack API Token passed in via Connect
	private apiToken: string | null = null;

	// slack-client Real Time Messaging API
	private rtm: RTMClient | null = null;

	constructor(slackBridge: ISlackbridge, rocket: IRocketChatAdapter) {
		super(slackBridge, rocket);
	}

	/**
	 * Connect to the remote Slack server using the passed in token API and register for Slack events.
	 * @param apiToken
	 * @deprecated
	 */
	async connectLegacy(apiToken: string): Promise<boolean> {
		this.apiToken = apiToken;

		// Invalid apiToken causes unhandled errors
		if (!(await SlackAPI.verifyToken(apiToken))) {
			throw new Error('Invalid ApiToken for the slack legacy bot integration');
		}

		await this.disconnect();

		this._slackAPI = new SlackAPI(this.apiToken);
		this.rtm = new RTMClient(this.apiToken);

		this.registerForEvents();

		const connectResult = await this.rtm.start();

		if (connectResult) {
			slackLogger.info('Connected to Slack');
			slackLogger.debug('Slack connection result: ', connectResult);
		}

		return Boolean(connectResult);
	}

	async connectApp(_appCredential: SlackAppCredentials): Promise<boolean> {
		return false;
	}

	registerForEvents(): void {
		if (!this.rtm) {
			return;
		}

		slackLogger.debug('Register for events');
		this.rtm.on('authenticated', () => {
			slackLogger.info('Connected to Slack');
		});

		this.rtm.on('unable_to_rtm_start', () => {
			// Using "void" because the JS code didn't have anything
			void this.slackBridge.disconnect();
		});

		this.rtm.on('disconnected', () => {
			slackLogger.info('Disconnected from Slack');
			// Using "void" because the JS code didn't have anything
			void this.slackBridge.disconnect();
		});

		/**
		 * Event fired when someone messages a channel the bot is in
		 * {
		 *	type: 'message',
		 * 	channel: [channel_id],
		 * 	user: [user_id],
		 * 	text: [message],
		 * 	ts: [ts.milli],
		 * 	team: [team_id],
		 * 	subtype: [message_subtype],
		 * 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]
		 * }
		 **/
		this.rtm.on('message', async (slackMessage) => {
			slackLogger.debug('OnSlackEvent-MESSAGE: ', slackMessage);
			if (slackMessage) {
				try {
					await this.onMessage(slackMessage);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onMessage', err });
				}
			}
		});

		this.rtm.on('reaction_added', async (reactionMsg) => {
			slackLogger.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);
			if (reactionMsg) {
				try {
					await this.onReactionAdded(reactionMsg);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onReactionAdded', err });
				}
			}
		});

		this.rtm.on('reaction_removed', async (reactionMsg) => {
			slackLogger.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);
			if (reactionMsg) {
				try {
					await this.onReactionRemoved(reactionMsg);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onReactionRemoved', err });
				}
			}
		});

		/**
		 * Event fired when someone creates a public channel
		 * {
		 *	type: 'channel_created',
		 *	channel: {
		 *		id: [channel_id],
		 *		is_channel: true,
		 *		name: [channel_name],
		 *		created: [ts],
		 *		creator: [user_id],
		 *		is_shared: false,
		 *		is_org_shared: false
		 *	},
		 *	event_ts: [ts.milli]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('channel_created', () => {});

		/**
		 * Event fired when the bot joins a public channel
		 * {
		 * 	type: 'channel_joined',
		 * 	channel: {
		 * 		id: [channel_id],
		 * 		name: [channel_name],
		 * 		is_channel: true,
		 * 		created: [ts],
		 * 		creator: [user_id],
		 * 		is_archived: false,
		 * 		is_general: false,
		 * 		is_member: true,
		 * 		last_read: [ts.milli],
		 * 		latest: [message_obj],
		 * 		unread_count: 0,
		 * 		unread_count_display: 0,
		 * 		members: [ user_ids ],
		 * 		topic: {
		 * 			value: [channel_topic],
		 * 			creator: [user_id],
		 * 			last_set: 0
		 * 		},
		 * 		purpose: {
		 * 			value: [channel_purpose],
		 * 			creator: [user_id],
		 * 			last_set: 0
		 * 		}
		 * 	}
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('channel_joined', () => {});

		/**
		 * Event fired when the bot leaves (or is removed from) a public channel
		 * {
		 * 	type: 'channel_left',
		 * 	channel: [channel_id]
		 * }
		 **/
		this.rtm.on('channel_left', (channelLeftMsg) => {
			slackLogger.debug('OnSlackEvent-CHANNEL_LEFT: ', channelLeftMsg);
			if (channelLeftMsg) {
				try {
					this.onChannelLeft(channelLeftMsg);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onChannelLeft', err });
				}
			}
		});

		/**
		 * Event fired when an archived channel is deleted by an admin
		 * {
		 * 	type: 'channel_deleted',
		 * 	channel: [channel_id],
		 *	event_ts: [ts.milli]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('channel_deleted', () => {});

		/**
		 * Event fired when the channel has its name changed
		 * {
		 * 	type: 'channel_rename',
		 * 	channel: {
		 * 		id: [channel_id],
		 * 		name: [channel_name],
		 * 		is_channel: true,
		 * 		created: [ts]
		 * 	},
		 *	event_ts: [ts.milli]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('channel_rename', () => {});

		/**
		 * Event fired when the bot joins a private channel
		 * {
		 * 	type: 'group_joined',
		 * 	channel: {
		 * 		id: [channel_id],
		 * 		name: [channel_name],
		 * 		is_group: true,
		 * 		created: [ts],
		 * 		creator: [user_id],
		 * 		is_archived: false,
		 * 		is_mpim: false,
		 * 		is_open: true,
		 * 		last_read: [ts.milli],
		 * 		latest: [message_obj],
		 * 		unread_count: 0,
		 * 		unread_count_display: 0,
		 * 		members: [ user_ids ],
		 * 		topic: {
		 * 			value: [channel_topic],
		 * 			creator: [user_id],
		 * 			last_set: 0
		 * 		},
		 * 		purpose: {
		 * 			value: [channel_purpose],
		 * 			creator: [user_id],
		 * 			last_set: 0
		 * 		}
		 * 	}
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('group_joined', () => {});

		/**
		 * Event fired when the bot leaves (or is removed from) a private channel
		 * {
		 * 	type: 'group_left',
		 * 	channel: [channel_id]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('group_left', () => {});

		/**
		 * Event fired when the private channel has its name changed
		 * {
		 * 	type: 'group_rename',
		 * 	channel: {
		 * 		id: [channel_id],
		 * 		name: [channel_name],
		 * 		is_group: true,
		 * 		created: [ts]
		 * 	},
		 *	event_ts: [ts.milli]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('group_rename', () => {});

		/**
		 * Event fired when a new user joins the team
		 * {
		 * 	type: 'team_join',
		 * 	user:
		 * 	{
		 * 		id: [user_id],
		 * 		team_id: [team_id],
		 * 		name: [user_name],
		 * 		deleted: false,
		 * 		status: null,
		 * 		color: [color_code],
		 * 		real_name: '',
		 * 		tz: [timezone],
		 * 		tz_label: [timezone_label],
		 * 		tz_offset: [timezone_offset],
		 * 		profile:
		 * 		{
		 * 			avatar_hash: '',
		 * 			real_name: '',
		 * 			real_name_normalized: '',
		 * 			email: '',
		 * 			image_24: '',
		 * 			image_32: '',
		 * 			image_48: '',
		 * 			image_72: '',
		 * 			image_192: '',
		 * 			image_512: '',
		 * 			fields: null
		 * 		},
		 * 		is_admin: false,
		 * 		is_owner: false,
		 * 		is_primary_owner: false,
		 * 		is_restricted: false,
		 * 		is_ultra_restricted: false,
		 * 		is_bot: false,
		 * 		presence: [user_presence]
		 * 	},
		 * 	cache_ts: [ts]
		 * }
		 **/
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		this.rtm.on('team_join', () => {});
	}

	/**
	 * Unregister for slack events and disconnect from Slack
	 */
	async disconnect() {
		if (this.rtm?.connected && this.rtm.disconnect) {
			await this.rtm.disconnect();
		}
	}
}
