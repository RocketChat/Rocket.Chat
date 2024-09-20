import http from 'http';
import https from 'https';
import url from 'url';

import { Message } from '@rocket.chat/core-services';
import { Messages, Rooms, Users, ReadReceipts } from '@rocket.chat/models';
import { App as SlackApp } from '@slack/bolt';
import { RTMClient } from '@slack/rtm-api';
import { Meteor } from 'meteor/meteor';

import { saveRoomName, saveRoomTopic } from '../../channel-settings/server';
import { FileUpload } from '../../file-upload/server';
import { addUserToRoom } from '../../lib/server/functions/addUserToRoom';
import { archiveRoom } from '../../lib/server/functions/archiveRoom';
import { deleteMessage } from '../../lib/server/functions/deleteMessage';
import { removeUserFromRoom } from '../../lib/server/functions/removeUserFromRoom';
import { sendMessage } from '../../lib/server/functions/sendMessage';
import { unarchiveRoom } from '../../lib/server/functions/unarchiveRoom';
import { updateMessage } from '../../lib/server/functions/updateMessage';
import { executeSetReaction } from '../../reactions/server/setReaction';
import { settings } from '../../settings/server';
import { getUserAvatarURL } from '../../utils/server/getUserAvatarURL';
import { SlackAPI } from './SlackAPI';
import { slackLogger } from './logger';

export default class SlackAdapter {
	constructor(slackBridge) {
		slackLogger.debug('constructor');
		this.slackBridge = slackBridge;
		this.rtm = {}; // slack-client Real Time Messaging API
		this.apiToken = {}; // Slack API Token passed in via Connect
		this.slackApp = {};
		this.appCredential = {};
		// On Slack, a rocket integration bot will be added to slack channels, this is the list of those channels, key is Rocket Ch ID
		this.slackChannelRocketBotMembershipMap = new Map(); // Key=RocketChannelID, Value=SlackChannel
		this.rocket = {};
		this.messagesBeingSent = [];
		this.slackBotId = false;

		this.slackAPI = {};
	}

	async connect({ apiToken, appCredential }) {
		try {
			const connectResult = await (appCredential ? this.connectApp(appCredential) : this.connectLegacy(apiToken));

			if (connectResult) {
				slackLogger.info('Connected to Slack');
				slackLogger.debug('Slack connection result: ', connectResult);
				Meteor.startup(async () => {
					try {
						await this.populateMembershipChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
					} catch (err) {
						slackLogger.error({ msg: 'Error attempting to connect to Slack', err });
						if (err.data.error === 'invalid_auth') {
							slackLogger.error('The provided token is invalid');
						}
						this.slackBridge.disconnect();
					}
				});
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
	async connectApp(appCredential) {
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
	async connectLegacy(apiToken) {
		this.apiToken = apiToken;

		// Invalid apiToken causes unhandled errors
		if (!(await SlackAPI.verifyToken(apiToken))) {
			throw new Error('Invalid ApiToken for the slack legacy bot integration');
		}

		if (RTMClient != null) {
			RTMClient.disconnect;
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
		if (this.rtm.connected && this.rtm.disconnect) {
			await this.rtm.disconnect();
		} else if (this.slackApp.stop) {
			await this.slackApp.stop();
		}
	}

	setRocket(rocket) {
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

		this.slackApp.error((error) => {
			slackLogger.error({ msg: 'Error on SlackApp', error });
		});
	}

	/**
	 * @deprecated
	 */
	registerForEventsLegacy() {
		slackLogger.debug('Register for events');
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
	async onReactionRemoved(slackReactionMsg) {
		if (slackReactionMsg) {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}
			const rocketUser = await this.rocket.getUser(slackReactionMsg.user);
			// Lets find our Rocket originated message
			let rocketMsg = await Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				// Must have originated from Slack
				const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = await Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${slackReactionMsg.reaction}:`;
				const theReaction = (rocketMsg.reactions || {})[rocketReaction];

				// If the Rocket user has already been removed, then this is an echo back from slack
				if (rocketMsg.reactions && theReaction) {
					if (rocketUser.roles.includes('bot')) {
						return;
					}
					if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
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
	async onReactionAdded(slackReactionMsg) {
		if (slackReactionMsg) {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}
			const rocketUser = await this.rocket.getUser(slackReactionMsg.user);

			if (rocketUser.roles.includes('bot')) {
				return;
			}

			// Lets find our Rocket originated message
			let rocketMsg = await Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				// Must have originated from Slack
				const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = await Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${slackReactionMsg.reaction}:`;

				// If the Rocket user has already reacted, then this is Slack echoing back to us
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
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

	onChannelLeft(channelLeftMsg) {
		this.removeSlackChannel(channelLeftMsg.channel);
	}

	/**
	 * We have received a message from slack and we need to save/delete/update it into rocket
	 * https://api.slack.com/events/message
	 */
	async onMessage(slackMessage, isImporting) {
		const isAFileShare = slackMessage && slackMessage.files && Array.isArray(slackMessage.files) && slackMessage.files.length;
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

	async postFindChannel(rocketChannelName) {
		slackLogger.debug('Searching for Slack channel or group', rocketChannelName);
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
	getTimeStamp(rocketMsg) {
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
	addSlackChannel(rocketChID, slackChID) {
		const ch = this.getSlackChannel(rocketChID);
		if (ch == null) {
			slackLogger.debug('Added channel', { rocketChID, slackChID });
			this.slackChannelRocketBotMembershipMap.set(rocketChID, {
				id: slackChID,
				family: slackChID.charAt(0) === 'C' ? 'channels' : 'groups',
			});
		}
	}

	removeSlackChannel(slackChID) {
		const keys = this.slackChannelRocketBotMembershipMap.keys();
		let slackChannel;
		let key;
		while ((key = keys.next().value) != null) {
			slackChannel = this.slackChannelRocketBotMembershipMap.get(key);
			if (slackChannel.id === slackChID) {
				// Found it, need to delete it
				this.slackChannelRocketBotMembershipMap.delete(key);
				break;
			}
		}
	}

	getSlackChannel(rocketChID) {
		return this.slackChannelRocketBotMembershipMap.get(rocketChID);
	}

	async populateMembershipChannelMapByChannels() {
		const channels = await this.slackAPI.getChannels();
		if (!channels || channels.length <= 0) {
			return;
		}

		for await (const slackChannel of channels) {
			const rocketchat_room =
				(await Rooms.findOneByName(slackChannel.name, { projection: { _id: 1 } })) ||
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

		for await (const slackGroup of groups) {
			const rocketchat_room =
				(await Rooms.findOneByName(slackGroup.name, { projection: { _id: 1 } })) ||
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
	async postReactionAdded(reaction, slackChannel, slackTS) {
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
	async postReactionRemove(reaction, slackChannel, slackTS) {
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

	async postDeleteMessage(rocketMessage) {
		if (rocketMessage) {
			const slackChannel = this.getSlackChannel(rocketMessage.rid);

			if (slackChannel != null) {
				const data = {
					ts: this.getTimeStamp(rocketMessage),
					channel: this.getSlackChannel(rocketMessage.rid).id,
					as_user: true,
				};

				slackLogger.debug('Post Delete Message to Slack', data);
				const postResult = await this.slackAPI.removeMessage(data);
				if (postResult) {
					slackLogger.debug('Message deleted on Slack');
				}
			}
		}
	}

	storeMessageBeingSent(data) {
		this.messagesBeingSent.push(data);
	}

	removeMessageBeingSent(data) {
		const idx = this.messagesBeingSent.indexOf(data);
		if (idx >= 0) {
			this.messagesBeingSent.splice(idx, 1);
		}
	}

	isMessageBeingSent(username, channel) {
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

	createSlackMessageId(ts, channelId) {
		return `slack${channelId ? `-${channelId}` : ''}-${ts.replace(/\./g, '-')}`;
	}

	async postMessage(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			let iconUrl = getUserAvatarURL(rocketMessage.u && rocketMessage.u.username);
			if (iconUrl) {
				iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
			}
			const data = {
				text: rocketMessage.msg,
				channel: slackChannel.id,
				username: rocketMessage.u && rocketMessage.u.username,
				icon_url: iconUrl,
				link_names: 1,
			};

			if (rocketMessage.tmid) {
				const tmessage = await Messages.findOneById(rocketMessage.tmid);
				if (tmessage && tmessage.slackTs) {
					data.thread_ts = tmessage.slackTs;
				}
			}
			slackLogger.debug('Post Message To Slack', data);

			// If we don't have the bot id yet and we have multiple slack bridges, we need to keep track of the messages that are being sent
			if (!this.slackBotId && this.rocket.slackAdapters && this.rocket.slackAdapters.length >= 2) {
				this.storeMessageBeingSent(data);
			}

			const postResult = await this.slackAPI.sendMessage(data);

			if (!this.slackBotId && this.rocket.slackAdapters && this.rocket.slackAdapters.length >= 2) {
				this.removeMessageBeingSent(data);
			}

			if (postResult && postResult.message && postResult.message.bot_id && postResult.message.ts) {
				this.slackBotId = postResult.message.bot_id;
				await Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.message.bot_id, postResult.message.ts);
				slackLogger.debug(`RocketMsgID=${rocketMessage._id} SlackMsgID=${postResult.message.ts} SlackBotID=${postResult.message.bot_id}`);
			}
		}
	}

	/*
	 https://api.slack.com/methods/chat.update
	 */
	async postMessageUpdate(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			const data = {
				ts: this.getTimeStamp(rocketMessage),
				channel: slackChannel.id,
				text: rocketMessage.msg,
				as_user: true,
			};
			slackLogger.debug('Post UpdateMessage To Slack', data);
			const postResult = await this.slackAPI.updateMessage(data);
			if (postResult) {
				slackLogger.debug('Message updated on Slack');
			}
		}
	}

	async processMemberJoinChannel(event, context) {
		slackLogger.debug('Member join channel', event.channel);
		const rocketCh = await this.rocket.getChannel({ channel: event.channel });
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, event.channel);
			if (context?.botUserId !== event?.user) {
				const rocketChatUser = await this.rocket.getUser(event.user);
				await addUserToRoom(rocketCh._id, rocketChatUser);
			}
		}
	}

	async processChannelJoin(slackMessage) {
		slackLogger.debug('Channel join', slackMessage.channel.id);
		const rocketCh = await this.rocket.addChannel(slackMessage.channel);
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, slackMessage.channel);
		}
	}

	async processFileShare(slackMessage) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}
		const file = slackMessage.files[0];

		if (file && file.url_private_download !== undefined) {
			const rocketChannel = await this.rocket.getChannel(slackMessage);
			const rocketUser = await this.rocket.getUser(slackMessage.user);

			// Hack to notify that a file was attempted to be uploaded
			delete slackMessage.subtype;

			// If the text includes the file link, simply use the same text for the rocket message.
			// If the link was not included, then use it instead of the message.

			if (slackMessage.text.indexOf(file.permalink) < 0) {
				slackMessage.text = file.permalink;
			}

			const ts = new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000);
			const msgDataDefaults = {
				_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
				ts,
				updatedBySlack: true,
			};

			await this.rocket.createAndSaveMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, false);
		}
	}

	/*
	 https://api.slack.com/events/message/message_deleted
	 */
	async processMessageDeleted(slackMessage) {
		if (slackMessage.previous_message) {
			const rocketChannel = await this.rocket.getChannel(slackMessage);
			const rocketUser = await Users.findOneById('rocket.cat', { projection: { username: 1 } });

			if (rocketChannel && rocketUser) {
				// Find the Rocket message to delete
				let rocketMsgObj = await Messages.findOneBySlackBotIdAndSlackTs(
					slackMessage.previous_message.bot_id,
					slackMessage.previous_message.ts,
				);

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
	async processMessageChanged(slackMessage) {
		if (slackMessage.previous_message) {
			const currentMsg = await Messages.findOneById(this.rocket.createRocketID(slackMessage.channel, slackMessage.message.ts));

			// Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)
			if (currentMsg && slackMessage.message.text !== currentMsg.msg) {
				const rocketChannel = await this.rocket.getChannel(slackMessage);
				const rocketUser = slackMessage.previous_message.user
					? (await this.rocket.findUser(slackMessage.previous_message.user)) ||
					  (await this.rocket.addUser(slackMessage.previous_message.user))
					: null;

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
	async processNewMessage(slackMessage, isImporting) {
		const rocketChannel = await this.rocket.getChannel(slackMessage);
		let rocketUser = null;
		if (slackMessage.subtype === 'bot_message') {
			rocketUser = await Users.findOneById('rocket.cat', { projection: { username: 1 } });
		} else {
			rocketUser = slackMessage.user
				? (await this.rocket.findUser(slackMessage.user)) || (await this.rocket.addUser(slackMessage.user))
				: null;
		}
		if (rocketChannel && rocketUser) {
			const msgDataDefaults = {
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
				if (e.name === 'MongoError' && e.code === 11000) {
					return;
				}

				throw e;
			}
		}
	}

	async processBotMessage(rocketChannel, slackMessage) {
		const excludeBotNames = settings.get('SlackBridge_ExcludeBotnames');
		if (slackMessage.username !== undefined && excludeBotNames && slackMessage.username.match(excludeBotNames)) {
			return;
		}

		if (this.slackBotId) {
			if (slackMessage.bot_id === this.slackBotId) {
				return;
			}
		} else {
			const slackChannel = this.getSlackChannel(rocketChannel._id);
			if (this.isMessageBeingSent(slackMessage.username || slackMessage.bot_id, slackChannel.id)) {
				return;
			}
		}

		const rocketMsgObj = {
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

	async processMeMessage(rocketUser, slackMessage) {
		return this.rocket.addAliasToMsg(rocketUser.username, {
			msg: `_${await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`,
		});
	}

	async processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			await Message.saveSystemMessage('uj', rocketChannel._id, rocketUser.username, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await addUserToRoom(rocketChannel._id, rocketUser);
		}
	}

	async processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.inviter) {
			const inviter = slackMessage.inviter
				? (await this.rocket.findUser(slackMessage.inviter)) || (await this.rocket.addUser(slackMessage.inviter))
				: null;
			if (isImporting) {
				await Message.saveSystemMessage('au', rocketChannel._id, rocketUser.username, inviter, {
					ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
					imported: 'slackbridge',
				});
			} else {
				await addUserToRoom(rocketChannel._id, rocketUser, inviter);
			}
		}
	}

	async processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			await Message.saveSystemMessage('ul', rocketChannel._id, rocketUser.username, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await removeUserFromRoom(rocketChannel._id, rocketUser);
		}
	}

	async processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
		}
	}

	async processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
		}
	}

	async processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			await Message.saveSystemMessage('r', rocketChannel._id, slackMessage.name, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
		}
	}

	async processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
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

	async processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
			// TODO: refactor this logic to use the service to send this system message instead of using sendMessage
			const rocketMsgObj = {
				rid: rocketChannel._id,
				t: 'message_pinned',
				msg: '',
				u: {
					_id: rocketUser._id,
					username: rocketUser.username,
				},
				attachments: [
					{
						text: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
						author_name: slackMessage.attachments[0].author_subname,
						author_icon: getUserAvatarURL(slackMessage.attachments[0].author_subname),
						ts: new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000),
					},
				],
			};

			if (!isImporting && slackMessage.attachments[0].channel_id && slackMessage.attachments[0].ts) {
				const messageId = this.createSlackMessageId(slackMessage.attachments[0].ts, slackMessage.attachments[0].channel_id);
				await Messages.setPinnedByIdAndUserId(messageId, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
				if (settings.get('Message_Read_Receipt_Store_Users')) {
					await ReadReceipts.setPinnedByMessageId(messageId, true);
				}
			}

			return rocketMsgObj;
		}
		slackLogger.error('Pinned item with no attachment');
	}

	async processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		switch (slackMessage.subtype) {
			case 'bot_message':
				return this.processBotMessage(rocketChannel, slackMessage);
			case 'me_message':
				return this.processMeMessage(rocketUser, slackMessage);
			case 'channel_join':
				return this.processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'group_join':
				return this.processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'channel_leave':
			case 'group_leave':
				return this.processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'channel_topic':
			case 'group_topic':
				return this.processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'channel_purpose':
			case 'group_purpose':
				return this.processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'channel_name':
			case 'group_name':
				return this.processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'channel_archive':
			case 'group_archive':
				if (!isImporting) {
					await archiveRoom(rocketChannel, rocketUser);
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!isImporting) {
					await unarchiveRoom(rocketChannel);
				}
				return;
			case 'file_share':
				return this.processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting);
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
	async uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
		const requestModule = /https/i.test(slackFileURL) ? https : http;
		const parsedUrl = url.parse(slackFileURL, true);
		parsedUrl.headers = { Authorization: `Bearer ${this.apiToken}` };
		await requestModule.get(parsedUrl, async (stream) => {
			const fileStore = FileUpload.getStore('Uploads');

			const file = await fileStore.insert(details, stream);

			const url = file.url.replace(Meteor.absoluteUrl(), '/');
			const attachment = {
				title: file.name,
				title_link: url,
			};

			if (/^image\/.+/.test(file.type)) {
				attachment.image_url = url;
				attachment.image_type = file.type;
				attachment.image_size = file.size;
				attachment.image_dimensions = file.identify && file.identify.size;
			}
			if (/^audio\/.+/.test(file.type)) {
				attachment.audio_url = url;
				attachment.audio_type = file.type;
				attachment.audio_size = file.size;
			}
			if (/^video\/.+/.test(file.type)) {
				attachment.video_url = url;
				attachment.video_type = file.type;
				attachment.video_size = file.size;
			}

			const msg = {
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

			void sendMessage(rocketUser, msg, rocketChannel, true);
		});
	}

	async importFromHistory(options) {
		slackLogger.debug('Importing messages history');
		const data = await this.slackAPI.getHistory(options);
		if (Array.isArray(data.messages) && data.messages.length) {
			let latest = 0;
			for await (const message of data.messages.reverse()) {
				slackLogger.debug('MESSAGE: ', message);
				if (!latest || message.ts > latest) {
					latest = message.ts;
				}
				message.channel = options.channel;
				await this.onMessage(message, true);
			}
			return { has_more: data.has_more, ts: latest };
		}
	}

	async copyChannelInfo(rid, channelMap) {
		slackLogger.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
		const channel = await this.slackAPI.getRoomInfo(channelMap.id);
		if (channel) {
			const members = await this.slackAPI.getMembers(channelMap.id);
			if (members && Array.isArray(members) && members.length) {
				for await (const member of members) {
					const user = (await this.rocket.findUser(member)) || (await this.rocket.addUser(member));
					if (user) {
						slackLogger.debug('Adding user to room', user.username, rid);
						await addUserToRoom(rid, user, null, { skipSystemMessage: true });
					}
				}
			}

			let topic = '';
			let topic_last_set = 0;
			let topic_creator = null;
			if (channel && channel.topic && channel.topic.value) {
				topic = channel.topic.value;
				topic_last_set = channel.topic.last_set;
				topic_creator = channel.topic.creator;
			}

			if (channel && channel.purpose && channel.purpose.value) {
				if (topic_last_set) {
					if (topic_last_set < channel.purpose.last_set) {
						topic = channel.purpose.topic;
						topic_creator = channel.purpose.creator;
					}
				} else {
					topic = channel.purpose.topic;
					topic_creator = channel.purpose.creator;
				}
			}

			if (topic) {
				const creator = (await this.rocket.findUser(topic_creator)) || (await this.rocket.addUser(topic_creator));
				slackLogger.debug('Setting room topic', rid, topic, creator.username);
				await saveRoomTopic(rid, topic, creator, false);
			}
		}
	}

	async copyPins(rid, channelMap) {
		const items = await this.slackAPI.getPins(channelMap.id);
		if (items && Array.isArray(items) && items.length) {
			for await (const pin of items) {
				if (pin.message) {
					const user = await this.rocket.findUser(pin.message.user);
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
								author_icon: getUserAvatarURL(user.username),
								ts: new Date(parseInt(pin.message.ts.split('.')[0]) * 1000),
							},
						],
					};

					const messageId = this.createSlackMessageId(pin.message.ts, pin.channel);
					await Messages.setPinnedByIdAndUserId(messageId, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
					if (settings.get('Message_Read_Receipt_Store_Users')) {
						await ReadReceipts.setPinnedByMessageId(messageId, true);
					}
				}
			}
		}
	}

	async importMessages(rid, callback) {
		slackLogger.info('importMessages: ', rid);
		const rocketchat_room = await Rooms.findOneById(rid);
		if (rocketchat_room) {
			if (this.getSlackChannel(rid)) {
				await this.copyChannelInfo(rid, this.getSlackChannel(rid));

				slackLogger.debug('Importing messages from Slack to Rocket.Chat', this.getSlackChannel(rid), rid);

				let results = await this.importFromHistory({
					channel: this.getSlackChannel(rid).id,
					oldest: 1,
				});
				while (results && results.has_more) {
					// eslint-disable-next-line no-await-in-loop
					results = await this.importFromHistory({
						channel: this.getSlackChannel(rid).id,
						oldest: results.ts,
					});
				}

				slackLogger.debug('Pinning Slack channel messages to Rocket.Chat', this.getSlackChannel(rid), rid);
				await this.copyPins(rid, this.getSlackChannel(rid));

				return callback();
			}
			const slack_room = await this.postFindChannel(rocketchat_room.name);
			if (slack_room) {
				this.addSlackChannel(rid, slack_room.id);
				return this.importMessages(rid, callback);
			}
			slackLogger.error({ msg: 'Could not find Slack room with specified name', roomName: rocketchat_room.name });
			return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
		}
		slackLogger.error({ msg: 'Could not find Rocket.Chat room with specified id', rid });
		return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
	}
}
