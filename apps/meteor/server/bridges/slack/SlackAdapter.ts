/* oxlint-disable @typescript-eslint/no-empty-function */
import http from 'node:http';
import https from 'node:https';
import url from 'node:url';

import { Message, ClientSafeError } from '@rocket.chat/core-services';
import type { FileProp, IMessage, IRoom, IUser, MessageAttachment } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { App as SlackApp } from '@slack/bolt';
import type { MemberJoinedChannelEvent, ReactionAddedEvent, ReactionRemovedEvent } from '@slack/bolt';
import { RTMClient } from '@slack/rtm-api';
import type { ConversationsHistoryResponse } from '@slack/web-api';

import type RocketAdapter from './RocketAdapter';
import { SlackAPI } from './SlackAPI';
import { slackLogger } from './logger';
import type { SlackBridgeClass } from './slackbridge';
import { FileUpload } from '../../lib/media/file-upload';
import { deleteMessage } from '../../lib/messages/deleteMessage';
import { sendMessage } from '../../lib/messages/sendMessage';
import { updateMessage } from '../../lib/messages/updateMessage';
import { executeSetReaction } from '../../lib/messaging/reactions/setReaction';
import { addUserToRoom } from '../../lib/rooms/addUserToRoom';
import { archiveRoom } from '../../lib/rooms/archiveRoom';
import { removeUserFromRoom } from '../../lib/rooms/removeUserFromRoom';
import { saveRoomName, saveRoomTopic } from '../../lib/rooms/settings';
import { unarchiveRoom } from '../../lib/rooms/unarchiveRoom';
import { getWorkspaceURL } from '../../lib/utils/getURL';
import { getUserAvatarURL } from '../../lib/utils/getUserAvatarURL';
import { settings } from '../../settings';

type AppCredential = {
	botToken: string;
	appToken: string;
	signingSecret: string;
};

type SlackFile = {
	url_private_download?: string;
	permalink?: string;
	name?: string;
	size?: number;
	mimetype?: string;
};

type SlackReactionEvent = Pick<ReactionAddedEvent | ReactionRemovedEvent, 'user' | 'reaction'> & {
	item: { channel?: string; ts?: string };
};

type SlackChannelRef = {
	id: string;
	family: 'channels' | 'groups';
};

type SlackPostMessageData = {
	text?: string;
	channel: string;
	username?: string;
	icon_url?: string;
	link_names: number;
	thread_ts?: string;
};

// Slack `message` events across their subtypes, as received from RTM, Bolt and the history API
export type SlackMessage = {
	type?: string;
	subtype?: string;
	channel: string;
	user?: string;
	text?: string;
	ts: string;
	thread_ts?: string;
	bot_id?: string;
	username?: string;
	icons?: { emoji?: string };
	attachments?: (MessageAttachment & { author_subname?: string; channel_id?: string; ts?: string; text?: string })[];
	edited?: { ts: string };
	files?: SlackFile[];
	file?: SlackFile;
	pinned_to?: string[];
	inviter?: string;
	topic?: string;
	purpose?: string;
	name?: string;
	previous_message?: { ts: string; bot_id?: string; user?: string };
	message?: { ts: string; text?: string };
};

export type SlackBridgeMessage = Omit<Partial<IMessage>, 'imported' | 'bot' | 'file'> & {
	imported?: 'slackbridge';
	bot?: boolean;
	username?: string;
	file?: Pick<FileProp, '_id'>;
	editedAt?: Date;
	updatedBySlack?: boolean;
	slackTs?: string;
};

export type BridgedRocketMessage = IMessage & {
	editedAt?: Date;
	updatedBySlack?: boolean;
	slackTs?: string;
};

export default class SlackAdapter {
	slackBridge: SlackBridgeClass;

	rtm: RTMClient;

	apiToken: string;

	slackApp: SlackApp;

	appCredential: AppCredential;

	slackChannelRocketBotMembershipMap: Map<string, SlackChannelRef>;

	rocket: RocketAdapter;

	messagesBeingSent: SlackPostMessageData[];

	slackBotId: string | false;

	slackAPI: SlackAPI;

	constructor(slackBridge: SlackBridgeClass) {
		slackLogger.debug({ msg: 'constructor' });
		this.slackBridge = slackBridge;
		// On Slack, a rocket integration bot will be added to slack channels, this is the list of those channels, key is Rocket Ch ID
		this.slackChannelRocketBotMembershipMap = new Map(); // Key=RocketChannelID, Value=SlackChannel
		this.messagesBeingSent = [];
		this.slackBotId = false;
	}

	async connect({ apiToken, appCredential }: { apiToken?: string; appCredential?: AppCredential }) {
		try {
			const connectResult = await (appCredential ? this.connectApp(appCredential) : this.connectLegacy(apiToken ?? ''));

			if (connectResult) {
				slackLogger.info({ msg: 'Connected to Slack' });
				slackLogger.debug({ msg: 'Slack connection result', connectResult });
				try {
					await this.populateMembershipChannelMap();
				} catch (err) {
					slackLogger.error({ msg: 'Error attempting to connect to Slack', err });
					if ((err as { data: { error?: string } }).data.error === 'invalid_auth') {
						slackLogger.error('The provided token is invalid');
					}
					this.slackBridge.disconnect();
				}
			}
		} catch (err) {
			slackLogger.error({ msg: 'Error attempting to connect to Slack', err });
			this.slackBridge.disconnect();
		}
	}

	/**
	 * Connect to the remote Slack server using the passed in app credential and register for Slack events.
	 * @typedef {Object} AppCredential
	 * @property {string} botToken
	 * @property {string} appToken
	 * @property {string} signingSecret
	 * @param {AppCredential} appCredential
	 */
	async connectApp(appCredential: AppCredential) {
		this.appCredential = appCredential;

		// Invalid app credentials causes unhandled errors
		if (!(await SlackAPI.verifyAppCredentials(appCredential))) {
			throw new Error('Invalid app credentials (botToken or appToken) for the slack app');
		}
		this.slackAPI = new SlackAPI(this.appCredential.botToken);

		this.slackApp = new SlackApp({
			appToken: this.appCredential.appToken,
			signingSecret: this.appCredential.signingSecret,
			token: this.appCredential.botToken,
			socketMode: true,
		});

		this.registerForEvents();

		const connectionResult = await this.slackApp.start();

		return connectionResult;
	}

	/**
	 * Connect to the remote Slack server using the passed in token API and register for Slack events.
	 * @param apiToken
	 * @deprecated
	 */
	async connectLegacy(apiToken: string) {
		this.apiToken = apiToken;

		// Invalid apiToken causes unhandled errors
		if (!(await SlackAPI.verifyToken(apiToken))) {
			throw new Error('Invalid ApiToken for the slack legacy bot integration');
		}

		this.slackAPI = new SlackAPI(this.apiToken);
		this.rtm = new RTMClient(this.apiToken);

		this.registerForEventsLegacy();

		const connectionResult = await this.rtm.start();

		return connectionResult;
	}

	/**
	 * Unregister for slack events and disconnect from Slack
	 */
	async disconnect() {
		if (this.rtm?.connected && this.rtm.disconnect) {
			await this.rtm.disconnect();
		} else if (this.slackApp?.stop) {
			await this.slackApp.stop();
		}
	}

	setRocket(rocket: RocketAdapter) {
		this.rocket = rocket;
	}

	registerForEvents() {
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
		this.slackApp.message(async ({ message }) => {
			slackLogger.debug({ msg: 'OnSlackEvent-MESSAGE', message });
			if (message) {
				try {
					await this.onMessage(message as SlackMessage);
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
			slackLogger.debug({ msg: 'OnSlackEvent-REACTION_ADDED', event });
			try {
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
			slackLogger.debug({ msg: 'OnSlackEvent-REACTION_REMOVED', event });
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
			slackLogger.debug({ msg: 'OnSlackEvent-CHANNEL_LEFT', event });
			try {
				await this.processMemberJoinChannel(event, context);
			} catch (err) {
				slackLogger.error({ msg: 'Unhandled error onChannelLeft', err });
			}
		});

		this.slackApp.event('channel_left', async ({ event }) => {
			slackLogger.debug({ msg: 'OnSlackEvent-CHANNEL_LEFT', event });
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
	 * @deprecated
	 */
	registerForEventsLegacy() {
		slackLogger.debug({ msg: 'Register for events' });
		this.rtm.on('authenticated', () => {
			slackLogger.info('Connected to Slack');
		});

		this.rtm.on('unable_to_rtm_start', () => {
			this.slackBridge.disconnect();
		});

		this.rtm.on('disconnected', () => {
			slackLogger.info('Disconnected from Slack');
			this.slackBridge.disconnect();
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
		this.rtm.on('message', async (slackMessage: SlackMessage) => {
			slackLogger.debug({ msg: 'OnSlackEvent-MESSAGE', slackMessage });
			if (slackMessage) {
				try {
					await this.onMessage(slackMessage);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onMessage', err });
				}
			}
		});

		this.rtm.on('reaction_added', async (reactionMsg: SlackReactionEvent) => {
			slackLogger.debug({ msg: 'OnSlackEvent-REACTION_ADDED', reactionMsg });
			if (reactionMsg) {
				try {
					await this.onReactionAdded(reactionMsg);
				} catch (err) {
					slackLogger.error({ msg: 'Unhandled error onReactionAdded', err });
				}
			}
		});

		this.rtm.on('reaction_removed', async (reactionMsg: SlackReactionEvent) => {
			slackLogger.debug({ msg: 'OnSlackEvent-REACTION_REMOVED', reactionMsg });
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
		this.rtm.on('channel_joined', () => {});

		/**
		 * Event fired when the bot leaves (or is removed from) a public channel
		 * {
		 * 	type: 'channel_left',
		 * 	channel: [channel_id]
		 * }
		 **/
		this.rtm.on('channel_left', (channelLeftMsg: { channel: string }) => {
			slackLogger.debug({ msg: 'OnSlackEvent-CHANNEL_LEFT', channelLeftMsg });
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
		this.rtm.on('group_joined', () => {});

		/**
		 * Event fired when the bot leaves (or is removed from) a private channel
		 * {
		 * 	type: 'group_left',
		 * 	channel: [channel_id]
		 * }
		 **/
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
		this.rtm.on('team_join', () => {});
	}

	/*
	 https://api.slack.com/events/reaction_removed
	 */
	async onReactionRemoved(slackReactionMsg: SlackReactionEvent) {
		if (slackReactionMsg) {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}
			const { channel, ts } = slackReactionMsg.item;
			if (!channel || !ts) {
				return;
			}
			const rocketUser = await this.rocket.getUser(slackReactionMsg.user);
			// Lets find our Rocket originated message
			let rocketMsg = await Messages.findOneBySlackTs(ts);

			if (!rocketMsg) {
				// Must have originated from Slack
				const rocketID = this.rocket.createRocketID(channel, ts);
				rocketMsg = await Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${slackReactionMsg.reaction}:`;
				const theReaction = rocketMsg.reactions?.[rocketReaction];

				// If the Rocket user has already been removed, then this is an echo back from slack
				if (rocketMsg.reactions && theReaction) {
					if (rocketUser.roles.includes('bot')) {
						return;
					}
					if (!rocketUser.username || theReaction.usernames.indexOf(rocketUser.username) === -1) {
						return; // Reaction already removed
					}
				} else {
					// Reaction already removed
					return;
				}

				// Stash this away to key off it later so we don't send it back to Slack
				this.slackBridge.reactionsMap.set(`unset${rocketMsg._id}${rocketReaction}`, rocketUser);
				slackLogger.debug('Removing reaction from Slack');
				await executeSetReaction(rocketUser._id, rocketReaction, rocketMsg._id);
			}
		}
	}

	/*
	 https://api.slack.com/events/reaction_added
	 */
	async onReactionAdded(slackReactionMsg: SlackReactionEvent) {
		if (slackReactionMsg) {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}
			const { channel, ts } = slackReactionMsg.item;
			if (!channel || !ts) {
				return;
			}
			const rocketUser = await this.rocket.getUser(slackReactionMsg.user);

			if (rocketUser?.roles.includes('bot')) {
				return;
			}

			// Lets find our Rocket originated message
			let rocketMsg = await Messages.findOneBySlackTs(ts);

			if (!rocketMsg) {
				// Must have originated from Slack
				const rocketID = this.rocket.createRocketID(channel, ts);
				rocketMsg = await Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${slackReactionMsg.reaction}:`;

				// If the Rocket user has already reacted, then this is Slack echoing back to us
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (rocketUser.username && theReaction.usernames.indexOf(rocketUser.username) !== -1) {
							return; // Already reacted
						}
					}
				}

				// Stash this away to key off it later so we don't send it back to Slack
				this.slackBridge.reactionsMap.set(`set${rocketMsg._id}${rocketReaction}`, rocketUser);
				slackLogger.debug('Adding reaction from Slack');
				await executeSetReaction(rocketUser._id, rocketReaction, rocketMsg._id);
			}
		}
	}

	onChannelLeft(channelLeftMsg: { channel: string }) {
		this.removeSlackChannel(channelLeftMsg.channel);
	}

	/**
	 * We have received a message from slack and we need to save/delete/update it into rocket
	 * https://api.slack.com/events/message
	 */
	async onMessage(slackMessage: SlackMessage, isImporting = false) {
		const isAFileShare = slackMessage?.files && Array.isArray(slackMessage.files) && slackMessage.files.length;
		if (isAFileShare) {
			await this.processFileShare(slackMessage);
			return;
		}
		if (slackMessage.subtype) {
			switch (slackMessage.subtype) {
				case 'message_deleted':
					await this.processMessageDeleted(slackMessage);
					break;
				case 'message_changed':
					await this.processMessageChanged(slackMessage);
					break;
				case 'channel_join':
					await this.processChannelJoin(slackMessage);
					break;
				default:
					// Keeping backwards compatability for now, refactor later
					await this.processNewMessage(slackMessage, isImporting);
			}
		} else {
			// Simple message
			await this.processNewMessage(slackMessage, isImporting);
		}
	}

	async postFindChannel(rocketChannelName?: string) {
		slackLogger.debug({ msg: 'Searching for Slack channel or group', rocketChannelName });
		const channels = await this.slackAPI.getChannels();
		if (channels && channels.length > 0) {
			for (const channel of channels) {
				if (channel.name === rocketChannelName && channel.is_member === true) {
					return channel;
				}
			}
		}
		const groups = await this.slackAPI.getGroups();
		if (groups && groups.length > 0) {
			for (const group of groups) {
				if (group.name === rocketChannelName) {
					return group;
				}
			}
		}
	}

	/**
	 * Retrieves the Slack TS from a Rocket msg that originated from Slack
	 * @param rocketMsg
	 * @returns Slack TS or undefined if not a message that originated from slack
	 * @private
	 */
	getTimeStamp(rocketMsg: Pick<BridgedRocketMessage, '_id' | 'slackTs'>) {
		// slack-G3KJGGE15-1483081061-000169
		let slackTS;
		let index = rocketMsg._id.indexOf('slack-');
		if (index === 0) {
			// This is a msg that originated from Slack
			slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
			index = slackTS.indexOf('-');
			slackTS = slackTS.substr(index + 1, slackTS.length);
			slackTS = slackTS.replace('-', '.');
		} else {
			// This probably originated as a Rocket msg, but has been sent to Slack
			slackTS = rocketMsg.slackTs;
		}

		return slackTS;
	}

	/**
	 * Adds a slack channel to our collection that the rocketbot is a member of on slack
	 * @param rocketChID
	 * @param slackChID
	 */
	addSlackChannel(rocketChID: string, slackChID: string) {
		const ch = this.getSlackChannel(rocketChID);
		if (ch == null) {
			slackLogger.debug({ msg: 'Added channel', rocketChID, slackChID });
			this.slackChannelRocketBotMembershipMap.set(rocketChID, {
				id: slackChID,
				family: slackChID.charAt(0) === 'C' ? 'channels' : 'groups',
			});
		}
	}

	removeSlackChannel(slackChID: string) {
		const keys = this.slackChannelRocketBotMembershipMap.keys();
		let slackChannel;
		let key;
		while ((key = keys.next().value) != null) {
			slackChannel = this.slackChannelRocketBotMembershipMap.get(key);
			if (slackChannel?.id === slackChID) {
				// Found it, need to delete it
				this.slackChannelRocketBotMembershipMap.delete(key);
				break;
			}
		}
	}

	getSlackChannel(rocketChID: string) {
		return this.slackChannelRocketBotMembershipMap.get(rocketChID);
	}

	async populateMembershipChannelMapByChannels() {
		const channels = await this.slackAPI.getChannels();
		if (!channels || channels.length <= 0) {
			return;
		}

		for (const slackChannel of channels) {
			if (!slackChannel.id) {
				continue;
			}
			const rocketchat_room =
				(slackChannel.name && (await Rooms.findOneByName(slackChannel.name, { projection: { _id: 1 } }))) ||
				(await Rooms.findOneByImportId(slackChannel.id, { projection: { _id: 1 } }));
			if (rocketchat_room && slackChannel.is_member) {
				this.addSlackChannel(rocketchat_room._id, slackChannel.id);
			}
		}
	}

	async populateMembershipChannelMapByGroups() {
		const groups = await this.slackAPI.getGroups();
		if (!groups || groups.length <= 0) {
			return;
		}

		for (const slackGroup of groups) {
			if (!slackGroup.id) {
				continue;
			}
			const rocketchat_room =
				(slackGroup.name && (await Rooms.findOneByName(slackGroup.name, { projection: { _id: 1 } }))) ||
				(await Rooms.findOneByImportId(slackGroup.id, { projection: { _id: 1 } }));
			if (rocketchat_room && slackGroup.is_member) {
				this.addSlackChannel(rocketchat_room._id, slackGroup.id);
			}
		}
	}

	async populateMembershipChannelMap() {
		slackLogger.debug('Populating channel map');
		await this.populateMembershipChannelMapByChannels();
		await this.populateMembershipChannelMapByGroups();
	}

	/*
	 https://api.slack.com/methods/reactions.add
	 */
	async postReactionAdded(reaction: string, slackChannel: string, slackTS?: string) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS,
			};

			slackLogger.debug('Posting Add Reaction to Slack');
			const postResult = await this.slackAPI.react(data);
			if (postResult) {
				slackLogger.debug('Reaction added to Slack');
			}
		}
	}

	/*
	 https://api.slack.com/methods/reactions.remove
	 */
	async postReactionRemove(reaction: string, slackChannel: string, slackTS?: string) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS,
			};

			slackLogger.debug('Posting Remove Reaction to Slack');
			const postResult = await this.slackAPI.removeReaction(data);
			if (postResult) {
				slackLogger.debug('Reaction removed from Slack');
			}
		}
	}

	async postDeleteMessage(rocketMessage: IMessage) {
		if (rocketMessage) {
			const slackChannel = this.getSlackChannel(rocketMessage.rid);

			if (slackChannel != null) {
				const data = {
					ts: this.getTimeStamp(rocketMessage),
					channel: slackChannel.id,
					as_user: true,
				};

				slackLogger.debug({ msg: 'Post Delete Message to Slack', data });
				const postResult = await this.slackAPI.removeMessage(data);
				if (postResult) {
					slackLogger.debug('Message deleted on Slack');
				}
			}
		}
	}

	storeMessageBeingSent(data: SlackPostMessageData) {
		this.messagesBeingSent.push(data);
	}

	removeMessageBeingSent(data: SlackPostMessageData) {
		const idx = this.messagesBeingSent.indexOf(data);
		if (idx >= 0) {
			this.messagesBeingSent.splice(idx, 1);
		}
	}

	isMessageBeingSent(username?: string, channel?: string) {
		if (!this.messagesBeingSent.length) {
			return false;
		}

		return this.messagesBeingSent.some((messageData) => {
			if (messageData.username !== username) {
				return false;
			}

			if (messageData.channel !== channel) {
				return false;
			}

			return true;
		});
	}

	createSlackMessageId(ts: string, channelId?: string) {
		return `slack${channelId ? `-${channelId}` : ''}-${ts.replace(/\./g, '-')}`;
	}

	async postMessage(slackChannel: SlackChannelRef | undefined, rocketMessage: IMessage) {
		if (slackChannel?.id) {
			const username = rocketMessage.u?.username;
			const iconUrl = username != null ? getWorkspaceURL(`/avatar/${encodeURIComponent(username)}`) : undefined;
			const data: SlackPostMessageData = {
				text: rocketMessage.msg,
				channel: slackChannel.id,
				username: rocketMessage.u?.username,
				icon_url: iconUrl,
				link_names: 1,
			};

			if (rocketMessage.tmid) {
				const tmessage = await Messages.findOneById<BridgedRocketMessage>(rocketMessage.tmid);
				if (tmessage?.slackTs) {
					data.thread_ts = tmessage.slackTs;
				}
			}
			slackLogger.debug({ msg: 'Post Message To Slack', data });

			// If we don't have the bot id yet and we have multiple slack bridges, we need to keep track of the messages that are being sent
			if (!this.slackBotId && this.rocket.slackAdapters && this.rocket.slackAdapters.length >= 2) {
				this.storeMessageBeingSent(data);
			}

			const postResult = await this.slackAPI.sendMessage(data);

			if (!this.slackBotId && this.rocket.slackAdapters && this.rocket.slackAdapters.length >= 2) {
				this.removeMessageBeingSent(data);
			}

			if (postResult?.message?.bot_id && postResult.message.ts) {
				this.slackBotId = postResult.message.bot_id;
				await Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.message.bot_id, postResult.message.ts);
				slackLogger.debug({
					msg: 'Message posted to Slack',
					rocketMessageId: rocketMessage._id,
					slackMessageId: postResult.message.ts,
					slackBotId: postResult.message.bot_id,
				});
			}
		}
	}

	/*
	 https://api.slack.com/methods/chat.update
	 */
	async postMessageUpdate(slackChannel: SlackChannelRef | undefined, rocketMessage: IMessage) {
		if (slackChannel?.id) {
			const data = {
				ts: this.getTimeStamp(rocketMessage),
				channel: slackChannel.id,
				text: rocketMessage.msg,
				as_user: true,
			};
			slackLogger.debug({ msg: 'Post UpdateMessage To Slack', data });
			const postResult = await this.slackAPI.updateMessage(data);
			if (postResult) {
				slackLogger.debug('Message updated on Slack');
			}
		}
	}

	async processMemberJoinChannel(event: MemberJoinedChannelEvent, context: { botUserId?: string }) {
		slackLogger.debug({ msg: 'Member join channel', channel: event.channel });
		const rocketCh = await this.rocket.getChannel({ channel: event.channel });
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, event.channel);
			if (context?.botUserId !== event?.user) {
				const rocketChatUser = await this.rocket.getUser(event.user);
				if (rocketChatUser) {
					await addUserToRoom(rocketCh._id, rocketChatUser);
				}
			}
		}
	}

	async processChannelJoin(slackMessage: SlackMessage) {
		slackLogger.debug({ msg: 'Channel join', channelId: slackMessage.channel });
		const rocketCh = await this.rocket.addChannel(slackMessage.channel);
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, slackMessage.channel);
		}
	}

	async processFileShare(slackMessage: SlackMessage) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}
		const file = slackMessage.files?.[0];

		if (file?.url_private_download !== undefined) {
			const rocketChannel = await this.rocket.getChannel(slackMessage);
			const rocketUser = await this.rocket.getUser(slackMessage.user);
			if (!rocketChannel) {
				return;
			}

			// Hack to notify that a file was attempted to be uploaded
			delete slackMessage.subtype;

			// If the text includes the file link, simply use the same text for the rocket message.
			// If the link was not included, then use it instead of the message.

			if (file.permalink && (!slackMessage.text || slackMessage.text.indexOf(file.permalink) < 0)) {
				slackMessage.text = file.permalink;
			}

			const ts = new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000);
			const msgDataDefaults = {
				_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
				ts,
				updatedBySlack: true,
			};

			await this.rocket.createAndSaveMessage(rocketChannel, rocketUser ?? null, slackMessage, msgDataDefaults, false, this);
		}
	}

	/*
	 https://api.slack.com/events/message/message_deleted
	 */
	async processMessageDeleted(slackMessage: SlackMessage) {
		if (slackMessage.previous_message) {
			const rocketChannel = await this.rocket.getChannel(slackMessage);
			const rocketUser = await Users.findOneById('rocket.cat');

			if (rocketChannel && rocketUser) {
				// Find the Rocket message to delete
				let rocketMsgObj =
					slackMessage.previous_message.bot_id &&
					(await Messages.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts));

				if (!rocketMsgObj) {
					// Must have been a Slack originated msg
					const _id = this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);
					rocketMsgObj = await Messages.findOneById(_id);
				}

				if (rocketMsgObj) {
					await deleteMessage(rocketMsgObj, rocketUser);
					slackLogger.debug('Rocket message deleted by Slack');
				}
			}
		}
	}

	/*
	 https://api.slack.com/events/message/message_changed
	 */
	async processMessageChanged(slackMessage: SlackMessage) {
		if (slackMessage.previous_message && slackMessage.message) {
			const currentMsg = await Messages.findOneById(this.rocket.createRocketID(slackMessage.channel, slackMessage.message.ts));

			// Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)
			if (currentMsg && slackMessage.message.text !== currentMsg.msg) {
				const rocketChannel = await this.rocket.getChannel(slackMessage);
				const rocketUser = slackMessage.previous_message.user
					? (await this.rocket.findUser(slackMessage.previous_message.user)) ||
						(await this.rocket.addUser(slackMessage.previous_message.user))
					: null;
				if (!rocketChannel || !rocketUser) {
					return;
				}

				const rocketMsgObj = {
					// @TODO _id
					_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
					rid: rocketChannel._id,
					msg: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
					updatedBySlack: true, // We don't want to notify slack about this change since Slack initiated it
				};

				await updateMessage(rocketMsgObj, rocketUser);
				slackLogger.debug('Rocket message updated by Slack');
			}
		}
	}

	/*
	 This method will get refactored and broken down into single responsibilities
	 */
	async processNewMessage(slackMessage: SlackMessage, isImporting: boolean) {
		const rocketChannel = await this.rocket.getChannel(slackMessage);
		let rocketUser: IUser | null | undefined;
		if (slackMessage.subtype === 'bot_message') {
			rocketUser = await Users.findOneById('rocket.cat');
		} else {
			rocketUser = slackMessage.user
				? (await this.rocket.findUser(slackMessage.user)) || (await this.rocket.addUser(slackMessage.user))
				: null;
		}
		if (rocketChannel && rocketUser) {
			const msgDataDefaults: SlackBridgeMessage = {
				_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
			};
			if (isImporting) {
				msgDataDefaults.imported = 'slackbridge';
			}
			try {
				await this.rocket.createAndSaveMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting, this);
			} catch (e) {
				// http://www.mongodb.org/about/contributors/error-codes/
				// 11000 == duplicate key error
				if ((e as { name?: string }).name === 'MongoError' && (e as { code?: number }).code === 11000) {
					return;
				}

				throw e;
			}
		}
	}

	async processBotMessage(rocketChannel: IRoom, slackMessage: SlackMessage) {
		const excludeBotNames = settings.get<string>('SlackBridge_ExcludeBotnames');
		if (slackMessage.username !== undefined && excludeBotNames && slackMessage.username.match(excludeBotNames)) {
			return;
		}

		if (this.slackBotId) {
			if (slackMessage.bot_id === this.slackBotId) {
				return;
			}
		} else {
			const slackChannel = this.getSlackChannel(rocketChannel._id);
			if (this.isMessageBeingSent(slackMessage.username || slackMessage.bot_id, slackChannel?.id)) {
				return;
			}
		}

		const rocketMsgObj: SlackBridgeMessage = {
			msg: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
			rid: rocketChannel._id,
			bot: true,
			attachments: slackMessage.attachments,
			username: slackMessage.username || slackMessage.bot_id,
		};
		this.rocket.addAliasToMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);
		if (slackMessage.icons) {
			rocketMsgObj.emoji = slackMessage.icons.emoji;
		}
		return rocketMsgObj;
	}

	async processMeMessage(rocketUser: IUser, slackMessage: SlackMessage) {
		return this.rocket.addAliasToMsg(rocketUser.username, {
			msg: `_${await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`,
		});
	}

	async processChannelJoinMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (isImporting) {
			await Message.saveSystemMessage('uj', rocketChannel._id, rocketUser.username ?? '', rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await addUserToRoom(rocketChannel._id, rocketUser);
		}
	}

	async processGroupJoinMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (slackMessage.inviter) {
			const inviter = slackMessage.inviter
				? (await this.rocket.findUser(slackMessage.inviter)) || (await this.rocket.addUser(slackMessage.inviter))
				: null;
			if (isImporting) {
				if (inviter) {
					await Message.saveSystemMessage('au', rocketChannel._id, rocketUser.username ?? '', inviter, {
						ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
						imported: 'slackbridge',
					});
				}
			} else {
				await addUserToRoom(rocketChannel._id, rocketUser, inviter ?? undefined);
			}
		}
	}

	async processLeaveMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (isImporting) {
			await Message.saveSystemMessage('ul', rocketChannel._id, rocketUser.username ?? '', rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await removeUserFromRoom(rocketChannel._id, rocketUser);
		}
	}

	async processTopicMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.topic ?? '', rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
		}
	}

	async processPurposeMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.purpose ?? '', rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
		}
	}

	async processNameMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (isImporting) {
			await Message.saveSystemMessage('r', rocketChannel._id, slackMessage.name ?? '', rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
		}
	}

	async processShareMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		if (slackMessage.file?.url_private_download !== undefined) {
			const details = {
				message_id: this.createSlackMessageId(slackMessage.ts),
				name: slackMessage.file.name,
				size: slackMessage.file.size,
				type: slackMessage.file.mimetype,
				rid: rocketChannel._id,
			};
			return this.uploadFileFromSlack(
				details,
				slackMessage.file.url_private_download,
				rocketUser,
				rocketChannel,
				new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				isImporting,
			);
		}
	}

	async processPinnedItemMessage(rocketChannel: IRoom, rocketUser: IUser, slackMessage: SlackMessage, isImporting: boolean) {
		const pinned = slackMessage.attachments?.[0];
		if (pinned?.text) {
			// TODO: refactor this logic to use the service to send this system message instead of using sendMessage
			const rocketMsgObj: SlackBridgeMessage & Pick<IMessage, 'u'> = {
				rid: rocketChannel._id,
				t: 'message_pinned',
				msg: '',
				u: {
					_id: rocketUser._id,
					username: rocketUser.username ?? '',
				},
				attachments: [
					{
						text: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(pinned.text),
						author_name: pinned.author_subname,
						author_icon: getUserAvatarURL(pinned.author_subname ?? ''),
						ts: new Date(parseInt((pinned.ts ?? '').split('.')[0]) * 1000),
					},
				],
			};

			if (!isImporting && pinned.channel_id && pinned.ts) {
				const messageId = this.createSlackMessageId(pinned.ts, pinned.channel_id);
				await Messages.setPinnedByIdAndUserId(messageId, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
			}

			return rocketMsgObj;
		}
		slackLogger.error('Pinned item with no attachment');
	}

	async processSubtypedMessage(
		rocketChannel: IRoom,
		rocketUser: IUser,
		slackMessage: SlackMessage,
		isImporting: boolean,
	): Promise<SlackBridgeMessage | undefined> {
		switch (slackMessage.subtype) {
			case 'bot_message':
				return this.processBotMessage(rocketChannel, slackMessage);
			case 'me_message':
				return this.processMeMessage(rocketUser, slackMessage);
			case 'channel_join':
				await this.processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'group_join':
				await this.processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'channel_leave':
			case 'group_leave':
				await this.processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'channel_topic':
			case 'group_topic':
				await this.processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'channel_purpose':
			case 'group_purpose':
				await this.processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'channel_name':
			case 'group_name':
				await this.processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'channel_archive':
			case 'group_archive':
				if (!isImporting) {
					await archiveRoom(rocketChannel._id, { _id: rocketUser._id, username: rocketUser.username ?? '', name: rocketUser.name });
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!isImporting) {
					await unarchiveRoom(rocketChannel._id, { _id: rocketUser._id, username: rocketUser.username ?? '', name: rocketUser.name });
				}
				return;
			case 'file_share':
				await this.processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				return;
			case 'file_comment':
				slackLogger.error('File comment not implemented');
				return;
			case 'file_mention':
				slackLogger.error('File mentioned not implemented');
				return;
			case 'pinned_item':
				return this.processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'unpinned_item':
				slackLogger.error('Unpinned item not implemented');
		}
	}

	/**
	Uploads the file to the storage.
	@param [Object] details an object with details about the upload. name, size, type, and rid
	@param [String] fileUrl url of the file to download/import
	@param [Object] user the Rocket.Chat user
	@param [Object] room the Rocket.Chat room
	@param [Date] timeStamp the timestamp the file was uploaded
	**/
	// details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
	async uploadFileFromSlack(
		details: { message_id: string; name?: string; size?: number; type?: string; rid: string },
		slackFileURL: string,
		rocketUser: IUser,
		rocketChannel: IRoom,
		timeStamp: Date,
		isImporting: boolean,
	) {
		const requestModule = /https/i.test(slackFileURL) ? https : http;
		const parsedUrl = { ...url.parse(slackFileURL, true), headers: { Authorization: `Bearer ${this.slackAPI.token}` } };
		requestModule.get(parsedUrl, async (stream) => {
			const fileStore = FileUpload.getStore('Uploads');

			const file = await fileStore.insert(details, stream);

			const url = FileUpload.getPath(`${file._id}/${encodeURIComponent(file.name || '')}`);
			const attachment: Record<string, unknown> = {
				title: file.name,
				title_link: url,
			};

			if (/^image\/.+/.test(file.type ?? '')) {
				attachment.image_url = url;
				attachment.image_type = file.type;
				attachment.image_size = file.size;
				attachment.image_dimensions = file.identify?.size;
			}
			if (/^audio\/.+/.test(file.type ?? '')) {
				attachment.audio_url = url;
				attachment.audio_type = file.type;
				attachment.audio_size = file.size;
			}
			if (/^video\/.+/.test(file.type ?? '')) {
				attachment.video_url = url;
				attachment.video_type = file.type;
				attachment.video_size = file.size;
			}

			const msg: SlackBridgeMessage = {
				rid: details.rid,
				ts: timeStamp,
				msg: '',
				file: {
					_id: file._id,
				},
				groupable: false,
				attachments: [attachment],
			};

			if (isImporting) {
				msg.imported = 'slackbridge';
			}

			if (details.message_id && typeof details.message_id === 'string') {
				msg._id = details.message_id;
			}

			void sendMessage(rocketUser, msg, rocketChannel, { upsert: true });
		});
	}

	async importFromHistory(options: { channel: string; oldest: number | string }) {
		slackLogger.debug('Importing messages history');
		const data: ConversationsHistoryResponse = await this.slackAPI.getHistory(options);
		if (Array.isArray(data.messages) && data.messages.length) {
			let latest: number | string = 0;
			for (const message of data.messages.reverse()) {
				slackLogger.debug({ msg: 'MESSAGE', message });
				if (!latest || (message.ts ?? '') > latest) {
					latest = message.ts ?? '';
				}
				await this.onMessage({ ...message, channel: options.channel } as SlackMessage, true);
			}
			return { has_more: data.has_more, ts: latest };
		}
	}

	async copyChannelInfo(rid: string, channelMap: SlackChannelRef) {
		slackLogger.debug({ msg: 'Copying users from Slack channel to Rocket.Chat', channelId: channelMap.id, rid });
		const channel = await this.slackAPI.getRoomInfo(channelMap.id);
		if (channel) {
			const members = await this.slackAPI.getMembers(channelMap.id);
			if (members && Array.isArray(members) && members.length) {
				for (const member of members) {
					const user = (await this.rocket.findUser(member)) || (await this.rocket.addUser(member));
					if (user) {
						slackLogger.debug({ msg: 'Adding user to room', username: user.username, rid });
						await addUserToRoom(rid, user, undefined, { skipSystemMessage: true });
					}
				}
			}

			let topic: string | undefined = '';
			let topic_last_set = 0;
			let topic_creator: string | undefined;
			if (channel?.topic?.value) {
				topic = channel.topic.value;
				topic_last_set = channel.topic.last_set ?? 0;
				topic_creator = channel.topic.creator;
			}

			if (channel?.purpose?.value) {
				if (topic_last_set) {
					if (topic_last_set < (channel.purpose.last_set ?? 0)) {
						topic = channel.purpose.value;
						topic_creator = channel.purpose.creator;
					}
				} else {
					topic = channel.purpose.value;
					topic_creator = channel.purpose.creator;
				}
			}

			if (topic && topic_creator) {
				const creator = (await this.rocket.findUser(topic_creator)) || (await this.rocket.addUser(topic_creator));
				if (creator) {
					slackLogger.debug({ msg: 'Setting room topic', rid, topic, username: creator.username });
					await saveRoomTopic(rid, topic, creator, false);
				}
			}
		}
	}

	async copyPins(rid: string, channelMap: SlackChannelRef) {
		const items = await this.slackAPI.getPins(channelMap.id);
		if (items && Array.isArray(items) && items.length) {
			for (const pin of items) {
				if (pin.message?.user && pin.message.ts) {
					const user = await this.rocket.findUser(pin.message.user);
					if (!user) {
						continue;
					}
					// TODO: send this system message to the room as well (using the service)
					const msgObj = {
						rid,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: user._id,
							username: user.username,
						},
						attachments: [
							{
								text: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
								author_name: user.username,
								author_icon: getUserAvatarURL(user.username ?? ''),
								ts: new Date(parseInt(pin.message.ts.split('.')[0]) * 1000),
							},
						],
					};

					const messageId = this.createSlackMessageId(pin.message.ts, pin.channel);
					await Messages.setPinnedByIdAndUserId(messageId, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
				}
			}
		}
	}

	async importMessages(rid: string, callback: (error?: Error) => void): Promise<void> {
		slackLogger.info({ msg: 'importMessages', rid });
		const rocketchat_room = await Rooms.findOneById(rid);
		if (rocketchat_room) {
			const slackChannel = this.getSlackChannel(rid);
			if (slackChannel) {
				await this.copyChannelInfo(rid, slackChannel);

				slackLogger.debug({ msg: 'Importing messages from Slack to Rocket.Chat', slackChannel, rid });

				let results = await this.importFromHistory({
					channel: slackChannel.id,
					oldest: 1,
				});
				while (results?.has_more) {
					results = await this.importFromHistory({
						channel: slackChannel.id,
						oldest: results.ts,
					});
				}

				slackLogger.debug({ msg: 'Pinning Slack channel messages to Rocket.Chat', slackChannel, rid });
				await this.copyPins(rid, slackChannel);

				return callback();
			}
			const slack_room = await this.postFindChannel(rocketchat_room.name);
			if (slack_room?.id) {
				this.addSlackChannel(rid, slack_room.id);
				return this.importMessages(rid, callback);
			}
			slackLogger.error({ msg: 'Could not find Slack room with specified name', roomName: rocketchat_room.name });
			return callback(new ClientSafeError('error-slack-room-not-found', 'Could not find Slack room with specified name'));
		}
		slackLogger.error({ msg: 'Could not find Rocket.Chat room with specified id', rid });
		return callback(new ClientSafeError('error-invalid-room', 'Invalid room'));
	}
}
