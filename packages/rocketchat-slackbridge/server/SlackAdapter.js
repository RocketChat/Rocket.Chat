/* globals logger*/
import _ from 'underscore';
import url from 'url';
import http from 'http';
import https from 'https';


export default class SlackAdapter {

	constructor(slackBridge) {
		logger.slack.debug('constructor');
		this.slackBridge = slackBridge;
		this.slackClient = Npm.require('slack-client');
		this.rtm = {};	//slack-client Real Time Messaging API
		this.apiToken = {};	//Slack API Token passed in via Connect
		//On Slack, a rocket integration bot will be added to slack channels, this is the list of those channels, key is Rocket Ch ID
		this.slackChannelRocketBotMembershipMap = new Map(); //Key=RocketChannelID, Value=SlackChannel
		this.rocket = {};
	}

	/**
	 * Connect to the remote Slack server using the passed in token API and register for Slack events
	 * @param apiToken
	 */
	connect(apiToken) {
		this.apiToken = apiToken;

		const RtmClient = this.slackClient.RtmClient;
		if (null != RtmClient) {
			RtmClient.disconnect;
		}
		this.rtm = new RtmClient(this.apiToken);
		this.rtm.start();
		this.registerForEvents();

		Meteor.startup(() => {
			try {
				this.populateMembershipChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
			} catch (err) {
				logger.slack.error('Error attempting to connect to Slack', err);
				this.slackBridge.disconnect();
			}
		});
	}

	/**
	 * Unregister for slack events and disconnect from Slack
	 */
	disconnect() {
		this.rtm.disconnect && this.rtm.disconnect;
	}

	setRocket(rocket) {
		this.rocket = rocket;
	}

	registerForEvents() {
		logger.slack.debug('Register for events');
		const CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
		this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
			logger.slack.info('Connected to Slack');
		});

		this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
			this.slackBridge.disconnect();
		});

		this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
			logger.slack.info('Disconnected from Slack');
			this.slackBridge.disconnect();
		});

		const RTM_EVENTS = this.slackClient.RTM_EVENTS;

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
		this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment((slackMessage) => {
			logger.slack.debug('OnSlackEvent-MESSAGE: ', slackMessage);
			if (slackMessage) {
				try {
					this.onMessage(slackMessage);
				} catch (err) {
					logger.slack.error('Unhandled error onMessage', err);
				}
			}
		}));

		this.rtm.on(RTM_EVENTS.REACTION_ADDED, Meteor.bindEnvironment((reactionMsg) => {
			logger.slack.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);
			if (reactionMsg) {
				try {
					this.onReactionAdded(reactionMsg);
				} catch (err) {
					logger.slack.error('Unhandled error onReactionAdded', err);
				}
			}
		}));

		this.rtm.on(RTM_EVENTS.REACTION_REMOVED, Meteor.bindEnvironment((reactionMsg) => {
			logger.slack.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);
			if (reactionMsg) {
				try {
					this.onReactionRemoved(reactionMsg);
				} catch (err) {
					logger.slack.error('Unhandled error onReactionRemoved', err);
				}
			}
		}));

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
		this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment(() => {}));

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
		this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment(() => {}));

		/**
		 * Event fired when the bot leaves (or is removed from) a public channel
		 * {
		* 	type: 'channel_left',
		* 	channel: [channel_id]
		* }
		 **/
		this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment((channelLeftMsg) => {
			logger.slack.debug('OnSlackEvent-CHANNEL_LEFT: ', channelLeftMsg);
			if (channelLeftMsg) {
				try {
					this.onChannelLeft(channelLeftMsg);
				} catch (err) {
					logger.slack.error('Unhandled error onChannelLeft', err);
				}
			}


		}));

		/**
		 * Event fired when an archived channel is deleted by an admin
		 * {
		* 	type: 'channel_deleted',
		* 	channel: [channel_id],
		*	event_ts: [ts.milli]
		* }
		 **/
		this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment(() => {}));

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
		this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment(() => {}));

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
		this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment(() => {}));

		/**
		 * Event fired when the bot leaves (or is removed from) a private channel
		 * {
		* 	type: 'group_left',
		* 	channel: [channel_id]
		* }
		 **/
		this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment(() => {}));

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
		this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment(() => {}));

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
		this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment(() => {}));
	}

	/*
	 https://api.slack.com/events/reaction_removed
	 */
	onReactionRemoved(slackReactionMsg) {
		if (slackReactionMsg) {
			if (! this.slackBridge.isReactionsEnabled) {
				return;
			}
			const rocketUser = this.rocket.getUser(slackReactionMsg.user);
			//Lets find our Rocket originated message
			let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				//Must have originated from Slack
				const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${ slackReactionMsg.reaction }:`;

				//If the Rocket user has already been removed, then this is an echo back from slack
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
							return; //Reaction already removed
						}
					}
				} else {
					//Reaction already removed
					return;
				}

				//Stash this away to key off it later so we don't send it back to Slack
				this.slackBridge.reactionsMap.set(`unset${ rocketMsg._id }${ rocketReaction }`, rocketUser);
				logger.slack.debug('Removing reaction from Slack');
				Meteor.runAsUser(rocketUser._id, () => {
					Meteor.call('setReaction', rocketReaction, rocketMsg._id);
				});
			}
		}
	}

	/*
	 https://api.slack.com/events/reaction_added
	 */
	onReactionAdded(slackReactionMsg) {
		if (slackReactionMsg) {
			if (! this.slackBridge.isReactionsEnabled) {
				return;
			}
			const rocketUser = this.rocket.getUser(slackReactionMsg.user);

			if (rocketUser.roles.includes('bot')) {
				return;
			}

			//Lets find our Rocket originated message
			let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

			if (!rocketMsg) {
				//Must have originated from Slack
				const rocketID = this.rocket.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
				rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
			}

			if (rocketMsg && rocketUser) {
				const rocketReaction = `:${ slackReactionMsg.reaction }:`;

				//If the Rocket user has already reacted, then this is Slack echoing back to us
				if (rocketMsg.reactions) {
					const theReaction = rocketMsg.reactions[rocketReaction];
					if (theReaction) {
						if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
							return; //Already reacted
						}
					}
				}

				//Stash this away to key off it later so we don't send it back to Slack
				this.slackBridge.reactionsMap.set(`set${ rocketMsg._id }${ rocketReaction }`, rocketUser);
				logger.slack.debug('Adding reaction from Slack');
				Meteor.runAsUser(rocketUser._id, () => {
					Meteor.call('setReaction', rocketReaction, rocketMsg._id);
				});
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
	onMessage(slackMessage, isImporting) {
		if (slackMessage.subtype) {
			switch (slackMessage.subtype) {
				case 'message_deleted':
					this.processMessageDeleted(slackMessage);
					break;
				case 'message_changed':
					this.processMessageChanged(slackMessage);
					break;
				case 'channel_join':
					this.processChannelJoin(slackMessage);
					break;
				default:
					//Keeping backwards compatability for now, refactor later
					this.processNewMessage(slackMessage, isImporting);
			}
		} else {
			//Simple message
			this.processNewMessage(slackMessage, isImporting);
		}
	}

	postGetChannelInfo(slackChID) {
		logger.slack.debug('Getting slack channel info', slackChID);
		const response = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: slackChID } });
		if (response && response.data) {
			return response.data.channel;
		}
	}

	postFindChannel(rocketChannelName) {
		logger.slack.debug('Searching for Slack channel or group', rocketChannelName);
		let response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (const channel of response.data.channels) {
				if (channel.name === rocketChannelName && channel.is_member === true) {
					return channel;
				}
			}
		}
		response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (const group of response.data.groups) {
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
		//slack-G3KJGGE15-1483081061-000169
		let slackTS;
		let index = rocketMsg._id.indexOf('slack-');
		if (index === 0) {
			//This is a msg that originated from Slack
			slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
			index = slackTS.indexOf('-');
			slackTS = slackTS.substr(index+1, slackTS.length);
			slackTS = slackTS.replace('-', '.');
		} else {
			//This probably originated as a Rocket msg, but has been sent to Slack
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
		if (null == ch) {
			this.slackChannelRocketBotMembershipMap.set(rocketChID, { id: slackChID, family: slackChID.charAt(0) === 'C' ? 'channels' : 'groups' });
		}
	}

	removeSlackChannel(slackChID) {
		const keys = this.slackChannelRocketBotMembershipMap.keys();
		let slackChannel;
		let key;
		while ((key = keys.next().value) != null) {
			slackChannel = this.slackChannelRocketBotMembershipMap.get(key);
			if (slackChannel.id === slackChID) {
				//Found it, need to delete it
				this.slackChannelRocketBotMembershipMap.delete(key);
				break;
			}
		}
	}

	getSlackChannel(rocketChID) {
		return this.slackChannelRocketBotMembershipMap.get(rocketChID);
	}

	populateMembershipChannelMapByChannels() {
		const response = HTTP.get('https://slack.com/api/channels.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
			for (const slackChannel of response.data.channels) {
				const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackChannel.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					if (slackChannel.is_member) {
						this.addSlackChannel(rocketchat_room._id, slackChannel.id);
					}
				}
			}
		}
	}

	populateMembershipChannelMapByGroups() {
		const response = HTTP.get('https://slack.com/api/groups.list', { params: { token: this.apiToken } });
		if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
			for (const slackGroup of response.data.groups) {
				const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackGroup.name, { fields: { _id: 1 } });
				if (rocketchat_room) {
					if (slackGroup.is_member) {
						this.addSlackChannel(rocketchat_room._id, slackGroup.id);
					}
				}
			}
		}
	}

	populateMembershipChannelMap() {
		logger.slack.debug('Populating channel map');
		this.populateMembershipChannelMapByChannels();
		this.populateMembershipChannelMapByGroups();
	}

	/*
	 https://api.slack.com/methods/reactions.add
	 */
	postReactionAdded(reaction, slackChannel, slackTS) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				token: this.apiToken,
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS
			};

			logger.slack.debug('Posting Add Reaction to Slack');
			const postResult = HTTP.post('https://slack.com/api/reactions.add', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.slack.debug('Reaction added to Slack');
			}
		}
	}

	/*
	 https://api.slack.com/methods/reactions.remove
	 */
	postReactionRemove(reaction, slackChannel, slackTS) {
		if (reaction && slackChannel && slackTS) {
			const data = {
				token: this.apiToken,
				name: reaction,
				channel: slackChannel,
				timestamp: slackTS
			};

			logger.slack.debug('Posting Remove Reaction to Slack');
			const postResult = HTTP.post('https://slack.com/api/reactions.remove', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.slack.debug('Reaction removed from Slack');
			}
		}
	}

	postDeleteMessage(rocketMessage) {
		if (rocketMessage) {
			const slackChannel = this.getSlackChannel(rocketMessage.rid);

			if (slackChannel != null) {
				const data = {
					token: this.apiToken,
					ts: this.getTimeStamp(rocketMessage),
					channel: this.getSlackChannel(rocketMessage.rid).id,
					as_user: true
				};

				logger.slack.debug('Post Delete Message to Slack', data);
				const postResult = HTTP.post('https://slack.com/api/chat.delete', {params: data});
				if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
					logger.slack.debug('Message deleted on Slack');
				}
			}
		}
	}

	postMessage(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			let iconUrl = getAvatarUrlFromUsername(rocketMessage.u && rocketMessage.u.username);
			if (iconUrl) {
				iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
			}
			const data = {
				token: this.apiToken,
				text: rocketMessage.msg,
				channel: slackChannel.id,
				username: rocketMessage.u && rocketMessage.u.username,
				icon_url: iconUrl,
				link_names: 1
			};
			logger.slack.debug('Post Message To Slack', data);
			const postResult = HTTP.post('https://slack.com/api/chat.postMessage', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.message && postResult.data.message.bot_id && postResult.data.message.ts) {
				RocketChat.models.Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.data.message.bot_id, postResult.data.message.ts);
				logger.slack.debug(`RocketMsgID=${ rocketMessage._id } SlackMsgID=${ postResult.data.message.ts } SlackBotID=${ postResult.data.message.bot_id }`);
			}
		}
	}

	/*
	 https://api.slack.com/methods/chat.update
	 */
	postMessageUpdate(slackChannel, rocketMessage) {
		if (slackChannel && slackChannel.id) {
			const data = {
				token: this.apiToken,
				ts: this.getTimeStamp(rocketMessage),
				channel: slackChannel.id,
				text: rocketMessage.msg,
				as_user: true
			};
			logger.slack.debug('Post UpdateMessage To Slack', data);
			const postResult = HTTP.post('https://slack.com/api/chat.update', { params: data });
			if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
				logger.slack.debug('Message updated on Slack');
			}
		}
	}

	processChannelJoin(slackMessage) {
		logger.slack.debug('Channel join', slackMessage.channel.id);
		const rocketCh = this.rocket.addChannel(slackMessage.channel);
		if (null != rocketCh) {
			this.addSlackChannel(rocketCh._id, slackMessage.channel);
		}
	}

	/*
	 https://api.slack.com/events/message/message_deleted
	 */
	processMessageDeleted(slackMessage) {
		if (slackMessage.previous_message) {
			const rocketChannel = this.rocket.getChannel(slackMessage);
			const rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });

			if (rocketChannel && rocketUser) {
				//Find the Rocket message to delete
				let rocketMsgObj = RocketChat.models.Messages
					.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts);

				if (!rocketMsgObj) {
					//Must have been a Slack originated msg
					const _id = this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);
					rocketMsgObj = RocketChat.models.Messages.findOneById(_id);
				}

				if (rocketMsgObj) {
					RocketChat.deleteMessage(rocketMsgObj, rocketUser);
					logger.slack.debug('Rocket message deleted by Slack');
				}
			}
		}
	}

	/*
	 https://api.slack.com/events/message/message_changed
	 */
	processMessageChanged(slackMessage) {
		if (slackMessage.previous_message) {
			const currentMsg = RocketChat.models.Messages.findOneById(this.rocket.createRocketID(slackMessage.channel, slackMessage.message.ts));

			//Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)
			if (currentMsg && (slackMessage.message.text !== currentMsg.msg)) {
				const rocketChannel = this.rocket.getChannel(slackMessage);
				const rocketUser = slackMessage.previous_message.user ? this.rocket.findUser(slackMessage.previous_message.user) || this.rocket.addUser(slackMessage.previous_message.user) : null;

				const rocketMsgObj = {
					//@TODO _id
					_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
					rid: rocketChannel._id,
					msg: this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
					updatedBySlack: true	//We don't want to notify slack about this change since Slack initiated it
				};

				RocketChat.updateMessage(rocketMsgObj, rocketUser);
				logger.slack.debug('Rocket message updated by Slack');
			}
		}
	}

	/*
	 This method will get refactored and broken down into single responsibilities
	 */
	processNewMessage(slackMessage, isImporting) {
		const rocketChannel = this.rocket.getChannel(slackMessage);
		let rocketUser = null;
		if (slackMessage.subtype === 'bot_message') {
			rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
		} else {
			rocketUser = slackMessage.user ? this.rocket.findUser(slackMessage.user) || this.rocket.addUser(slackMessage.user) : null;
		}
		if (rocketChannel && rocketUser) {
			const msgDataDefaults = {
				_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000)
			};
			if (isImporting) {
				msgDataDefaults['imported'] = 'slackbridge';
			}
			try {
				this.rocket.createAndSaveMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting);
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

	processBotMessage(rocketChannel, slackMessage) {
		const excludeBotNames = RocketChat.settings.get('SlackBridge_Botnames');
		if (slackMessage.username !== undefined && excludeBotNames && slackMessage.username.match(excludeBotNames)) {
			return;
		}

		const rocketMsgObj = {
			msg: this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
			rid: rocketChannel._id,
			bot: true,
			attachments: slackMessage.attachments,
			username: slackMessage.username || slackMessage.bot_id
		};
		this.rocket.addAliasToMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);
		if (slackMessage.icons) {
			rocketMsgObj.emoji = slackMessage.icons.emoji;
		}
		return rocketMsgObj;
	}

	processMeMessage(rocketUser, slackMessage) {
		return this.rocket.addAliasToMsg(rocketUser.username, {
			msg: `_${ this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text) }_`
		});
	}

	processChannelJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rocketChannel._id, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
		} else {
			RocketChat.addUserToRoom(rocketChannel._id, rocketUser);
		}
	}

	processGroupJoinMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.inviter) {
			const inviter = slackMessage.inviter ? this.rocket.findUser(slackMessage.inviter) || this.rocket.addUser(slackMessage.inviter) : null;
			if (isImporting) {
				RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rocketChannel._id, rocketUser, {
					ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
					u: {
						_id: inviter._id,
						username: inviter.username
					},
					imported: 'slackbridge'
				});
			} else {
				RocketChat.addUserToRoom(rocketChannel._id, rocketUser, inviter);
			}
		}
	}

	processLeaveMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rocketChannel._id, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge'
			});
		} else {
			RocketChat.removeUserFromRoom(rocketChannel._id, rocketUser);
		}
	}

	processTopicMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
		} else {
			RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
		}
	}

	processPurposeMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
		} else {
			RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
		}
	}

	processNameMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (isImporting) {
			RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rocketChannel._id, slackMessage.name, rocketUser, { ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), imported: 'slackbridge' });
		} else {
			RocketChat.saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
		}
	}

	processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
			const details = {
				message_id: `slack-${ slackMessage.ts.replace(/\./g, '-') }`,
				name: slackMessage.file.name,
				size: slackMessage.file.size,
				type: slackMessage.file.mimetype,
				rid: rocketChannel._id
			};
			return this.uploadFileFromSlack(details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
		}
	}

	processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
		if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
			const rocketMsgObj = {
				rid: rocketChannel._id,
				t: 'message_pinned',
				msg: '',
				u: {
					_id: rocketUser._id,
					username: rocketUser.username
				},
				attachments: [{
					'text' : this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
					'author_name' : slackMessage.attachments[0].author_subname,
					'author_icon' : getAvatarUrlFromUsername(slackMessage.attachments[0].author_subname),
					'ts' : new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000)
				}]
			};

			if (!isImporting) {
				RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${ slackMessage.attachments[0].channel_id }-${ slackMessage.attachments[0].ts.replace(/\./g, '-') }`, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
			}

			return rocketMsgObj;
		} else {
			logger.slack.error('Pinned item with no attachment');
		}
	}

	processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
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
					RocketChat.archiveRoom(rocketChannel);
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!isImporting) {
					RocketChat.unarchiveRoom(rocketChannel);
				}
				return;
			case 'file_share':
				return this.processShareMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'file_comment':
				logger.slack.error('File comment not implemented');
				return;
			case 'file_mention':
				logger.slack.error('File mentioned not implemented');
				return;
			case 'pinned_item':
				return this.processPinnedItemMessage(rocketChannel, rocketUser, slackMessage, isImporting);
			case 'unpinned_item':
				logger.slack.error('Unpinned item not implemented');
				return;
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
	//details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
	uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
		const requestModule = /https/i.test(slackFileURL) ? https : http;
		const parsedUrl = url.parse(slackFileURL, true);
		parsedUrl.headers = { 'Authorization': `Bearer ${ this.apiToken }` };
		requestModule.get(parsedUrl, Meteor.bindEnvironment((stream) => {
			const fileStore = FileUpload.getStore('Uploads');

			fileStore.insert(details, stream, (err, file) => {
				if (err) {
					throw new Error(err);
				} else {
					const url = file.url.replace(Meteor.absoluteUrl(), '/');
					const attachment = {
						title: file.name,
						title_link: url
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
							_id: file._id
						},
						groupable: false,
						attachments: [attachment]
					};

					if (isImporting) {
						msg.imported = 'slackbridge';
					}

					if (details.message_id && (typeof details.message_id === 'string')) {
						msg['_id'] = details.message_id;
					}

					return RocketChat.sendMessage(rocketUser, msg, rocketChannel, true);
				}
			});
		}));
	}

	importFromHistory(family, options) {
		logger.slack.debug('Importing messages history');
		const response = HTTP.get(`https://slack.com/api/${ family }.history`, { params: _.extend({ token: this.apiToken }, options) });
		if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
			let latest = 0;
			for (const message of response.data.messages.reverse()) {
				logger.slack.debug('MESSAGE: ', message);
				if (!latest || message.ts > latest) {
					latest = message.ts;
				}
				message.channel = options.channel;
				this.onMessage(message, true);
			}
			return { has_more: response.data.has_more, ts: latest };
		}
	}

	copyChannelInfo(rid, channelMap) {
		logger.slack.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
		const response = HTTP.get(`https://slack.com/api/${ channelMap.family }.info`, { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data) {
			const data = channelMap.family === 'channels' ? response.data.channel : response.data.group;
			if (data && _.isArray(data.members) && data.members.length > 0) {
				for (const member of data.members) {
					const user = this.rocket.findUser(member) || this.rocket.addUser(member);
					if (user) {
						logger.slack.debug('Adding user to room', user.username, rid);
						RocketChat.addUserToRoom(rid, user, null, true);
					}
				}
			}

			let topic = '';
			let topic_last_set = 0;
			let topic_creator = null;
			if (data && data.topic && data.topic.value) {
				topic = data.topic.value;
				topic_last_set = data.topic.last_set;
				topic_creator = data.topic.creator;
			}

			if (data && data.purpose && data.purpose.value) {
				if (topic_last_set) {
					if (topic_last_set < data.purpose.last_set) {
						topic = data.purpose.topic;
						topic_creator = data.purpose.creator;
					}
				} else {
					topic = data.purpose.topic;
					topic_creator = data.purpose.creator;
				}
			}

			if (topic) {
				const creator = this.rocket.findUser(topic_creator) || this.rocket.addUser(topic_creator);
				logger.slack.debug('Setting room topic', rid, topic, creator.username);
				RocketChat.saveRoomTopic(rid, topic, creator, false);
			}
		}
	}

	copyPins(rid, channelMap) {
		const response = HTTP.get('https://slack.com/api/pins.list', { params: { token: this.apiToken, channel: channelMap.id } });
		if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
			for (const pin of response.data.items) {
				if (pin.message) {
					const user = this.rocket.findUser(pin.message.user);
					const msgObj = {
						rid,
						t: 'message_pinned',
						msg: '',
						u: {
							_id: user._id,
							username: user.username
						},
						attachments: [{
							'text' : this.rocket.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
							'author_name' : user.username,
							'author_icon' : getAvatarUrlFromUsername(user.username),
							'ts' : new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
						}]
					};

					RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${ pin.channel }-${ pin.message.ts.replace(/\./g, '-') }`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
				}
			}
		}
	}

	importMessages(rid, callback) {
		logger.slack.info('importMessages: ', rid);
		const rocketchat_room = RocketChat.models.Rooms.findOneById(rid);
		if (rocketchat_room) {
			if (this.getSlackChannel(rid)) {
				this.copyChannelInfo(rid, this.getSlackChannel(rid));

				logger.slack.debug('Importing messages from Slack to Rocket.Chat', this.getSlackChannel(rid), rid);
				let results = this.importFromHistory(this.getSlackChannel(rid).family, { channel: this.getSlackChannel(rid).id, oldest: 1 });
				while (results && results.has_more) {
					results = this.importFromHistory(this.getSlackChannel(rid).family, { channel: this.getSlackChannel(rid).id, oldest: results.ts });
				}

				logger.slack.debug('Pinning Slack channel messages to Rocket.Chat', this.getSlackChannel(rid), rid);
				this.copyPins(rid, this.getSlackChannel(rid));

				return callback();
			} else {
				const slack_room = this.postFindChannel(rocketchat_room.name);
				if (slack_room) {
					this.addSlackChannel(rid, slack_room.id);
					return this.importMessages(rid, callback);
				} else {
					logger.slack.error('Could not find Slack room with specified name', rocketchat_room.name);
					return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
				}
			}
		} else {
			logger.slack.error('Could not find Rocket.Chat room with specified id', rid);
			return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
		}
	}

}

