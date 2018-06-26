/* globals logger*/

import _ from 'underscore';

export default class RocketAdapter {
	constructor(slackBridge) {
		logger.rocket.debug('constructor');
		this.slackBridge = slackBridge;
		this.util = Npm.require('util');

		this.userTags = {};
		this.slack = {};
	}

	connect() {
		this.registerForEvents();
	}

	disconnect() {
		this.unregisterForEvents();
	}

	setSlack(slack) {
		this.slack = slack;
	}

	registerForEvents() {
		logger.rocket.debug('Register for events');
		RocketChat.callbacks.add('afterSaveMessage', this.onMessage.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
		RocketChat.callbacks.add('afterDeleteMessage', this.onMessageDelete.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Delete');
		RocketChat.callbacks.add('setReaction', this.onSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_SetReaction');
		RocketChat.callbacks.add('unsetReaction', this.onUnSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
	}

	unregisterForEvents() {
		logger.rocket.debug('Unregister for events');
		RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
		RocketChat.callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
		RocketChat.callbacks.remove('setReaction', 'SlackBridge_SetReaction');
		RocketChat.callbacks.remove('unsetReaction', 'SlackBridge_UnSetReaction');
	}

	onMessageDelete(rocketMessageDeleted) {
		try {
			if (! this.slack.getSlackChannel(rocketMessageDeleted.rid)) {
				//This is on a channel that the rocket bot is not subscribed
				return;
			}
			logger.rocket.debug('onRocketMessageDelete', rocketMessageDeleted);

			this.slack.postDeleteMessage(rocketMessageDeleted);
		} catch (err) {
			logger.rocket.error('Unhandled error onMessageDelete', err);
		}
	}

	onSetReaction(rocketMsgID, reaction) {
		try {
			logger.rocket.debug('onRocketSetReaction');

			if (rocketMsgID && reaction) {
				if (this.slackBridge.reactionsMap.delete(`set${ rocketMsgID }${ reaction }`)) {
					//This was a Slack reaction, we don't need to tell Slack about it
					return;
				}
				const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);
				if (rocketMsg) {
					const slackChannel = this.slack.getSlackChannel(rocketMsg.rid);
					if (null != slackChannel) {
						const slackTS = this.slack.getTimeStamp(rocketMsg);
						this.slack.postReactionAdded(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
					}
				}
			}
		} catch (err) {
			logger.rocket.error('Unhandled error onSetReaction', err);
		}
	}

	onUnSetReaction(rocketMsgID, reaction) {
		try {
			logger.rocket.debug('onRocketUnSetReaction');

			if (rocketMsgID && reaction) {
				if (this.slackBridge.reactionsMap.delete(`unset${ rocketMsgID }${ reaction }`)) {
					//This was a Slack unset reaction, we don't need to tell Slack about it
					return;
				}

				const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);
				if (rocketMsg) {
					const slackChannel = this.slack.getSlackChannel(rocketMsg.rid);
					if (null != slackChannel) {
						const slackTS = this.slack.getTimeStamp(rocketMsg);
						this.slack.postReactionRemove(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
					}
				}
			}
		} catch (err) {
			logger.rocket.error('Unhandled error onUnSetReaction', err);
		}
	}

	onMessage(rocketMessage) {
		try {
			if (! this.slack.getSlackChannel(rocketMessage.rid)) {
				//This is on a channel that the rocket bot is not subscribed
				return;
			}
			logger.rocket.debug('onRocketMessage', rocketMessage);

			if (rocketMessage.editedAt) {
				//This is an Edit Event
				this.processMessageChanged(rocketMessage);
				return rocketMessage;
			}
			// Ignore messages originating from Slack
			if (rocketMessage._id.indexOf('slack-') === 0) {
				return rocketMessage;
			}

			//A new message from Rocket.Chat
			this.processSendMessage(rocketMessage);
		} catch (err) {
			logger.rocket.error('Unhandled error onMessage', err);
		}

		return rocketMessage;
	}

	processSendMessage(rocketMessage) {
		//Since we got this message, SlackBridge_Out_Enabled is true

		if (RocketChat.settings.get('SlackBridge_Out_All') === true) {
			this.slack.postMessage(this.slack.getSlackChannel(rocketMessage.rid), rocketMessage);
		} else {
			//They want to limit to certain groups
			const outSlackChannels = _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || [];
			//logger.rocket.debug('Out SlackChannels: ', outSlackChannels);
			if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
				this.slack.postMessage(this.slack.getSlackChannel(rocketMessage.rid), rocketMessage);
			}
		}
	}

	processMessageChanged(rocketMessage) {
		if (rocketMessage) {
			if (rocketMessage.updatedBySlack) {
				//We have already processed this
				delete rocketMessage.updatedBySlack;
				return;
			}

			//This was a change from Rocket.Chat
			const slackChannel = this.slack.getSlackChannel(rocketMessage.rid);
			this.slack.postMessageUpdate(slackChannel, rocketMessage);
		}
	}


	getChannel(slackMessage) {
		return slackMessage.channel ? this.findChannel(slackMessage.channel) || this.addChannel(slackMessage.channel) : null;
	}

	getUser(slackUser) {
		return slackUser ? this.findUser(slackUser) || this.addUser(slackUser) : null;
	}

	createRocketID(slackChannel, ts) {
		return `slack-${ slackChannel }-${ ts.replace(/\./g, '-') }`;
	}

	findChannel(slackChannelId) {
		return RocketChat.models.Rooms.findOneByImportId(slackChannelId);
	}

	addChannel(slackChannelID, hasRetried = false) {
		logger.rocket.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
		let slackResults = null;
		let isGroup = false;
		if (slackChannelID.charAt(0) === 'C') {
			slackResults = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.slackBridge.apiToken, channel: slackChannelID } });
		} else if (slackChannelID.charAt(0) === 'G') {
			slackResults = HTTP.get('https://slack.com/api/groups.info', { params: { token: this.slackBridge.apiToken, channel: slackChannelID } });
			isGroup = true;
		}
		if (slackResults && slackResults.data && slackResults.data.ok === true) {
			const rocketChannelData = isGroup ? slackResults.data.group : slackResults.data.channel;
			const existingRocketRoom = RocketChat.models.Rooms.findOneByName(rocketChannelData.name);

			// If the room exists, make sure we have its id in importIds
			if (existingRocketRoom || rocketChannelData.is_general) {
				rocketChannelData.rocketId = rocketChannelData.is_general ? 'GENERAL' : existingRocketRoom._id;
				RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
			} else {
				const rocketUsers = [];
				for (const member of rocketChannelData.members) {
					if (member !== rocketChannelData.creator) {
						const rocketUser = this.findUser(member) || this.addUser(member);
						if (rocketUser && rocketUser.username) {
							rocketUsers.push(rocketUser.username);
						}
					}
				}
				const rocketUserCreator = rocketChannelData.creator ? this.findUser(rocketChannelData.creator) || this.addUser(rocketChannelData.creator) : null;
				if (!rocketUserCreator) {
					logger.rocket.error('Could not fetch room creator information', rocketChannelData.creator);
					return;
				}

				try {
					const rocketChannel = RocketChat.createRoom(isGroup ? 'p' : 'c', rocketChannelData.name, rocketUserCreator.username, rocketUsers);
					rocketChannelData.rocketId = rocketChannel.rid;
				} catch (e) {
					if (!hasRetried) {
						logger.rocket.debug('Error adding channel from Slack. Will retry in 1s.', e.message);
						// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
						Meteor._sleepForMs(1000);
						return this.findChannel(slackChannelID) || this.addChannel(slackChannelID, true);
					} else {
						console.log(e.message);
					}
				}

				const roomUpdate = {
					ts: new Date(rocketChannelData.created * 1000)
				};
				let lastSetTopic = 0;
				if (!_.isEmpty(rocketChannelData.topic && rocketChannelData.topic.value)) {
					roomUpdate.topic = rocketChannelData.topic.value;
					lastSetTopic = rocketChannelData.topic.last_set;
				}
				if (!_.isEmpty(rocketChannelData.purpose && rocketChannelData.purpose.value) && rocketChannelData.purpose.last_set > lastSetTopic) {
					roomUpdate.topic = rocketChannelData.purpose.value;
				}
				RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
				this.slack.addSlackChannel(rocketChannelData.rocketId, slackChannelID);
			}
			return RocketChat.models.Rooms.findOneById(rocketChannelData.rocketId);
		}
		logger.rocket.debug('Channel not added');
		return;
	}

	findUser(slackUserID) {
		const rocketUser = RocketChat.models.Users.findOneByImportId(slackUserID);
		if (rocketUser && !this.userTags[slackUserID]) {
			this.userTags[slackUserID] = { slack: `<@${ slackUserID }>`, rocket: `@${ rocketUser.username }` };
		}
		return rocketUser;
	}

	addUser(slackUserID) {
		logger.rocket.debug('Adding Rocket.Chat user from Slack', slackUserID);
		const slackResults = HTTP.get('https://slack.com/api/users.info', { params: { token: this.slackBridge.apiToken, user: slackUserID } });
		if (slackResults && slackResults.data && slackResults.data.ok === true && slackResults.data.user) {
			const rocketUserData = slackResults.data.user;
			const isBot = rocketUserData.is_bot === true;
			const email = rocketUserData.profile && rocketUserData.profile.email || '';
			let existingRocketUser;
			if (!isBot) {
				existingRocketUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(rocketUserData.name);
			} else {
				existingRocketUser = RocketChat.models.Users.findOneByUsername(rocketUserData.name);
			}

			if (existingRocketUser) {
				rocketUserData.rocketId = existingRocketUser._id;
				rocketUserData.name = existingRocketUser.username;
			} else {
				const newUser = {
					password: Random.id(),
					username: rocketUserData.name
				};

				if (!isBot && email) {
					newUser.email = email;
				}

				if (isBot) {
					newUser.joinDefaultChannels = false;
				}

				rocketUserData.rocketId = Accounts.createUser(newUser);
				const userUpdate = {
					utcOffset: rocketUserData.tz_offset / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
					roles: isBot ? [ 'bot' ] : [ 'user' ]
				};

				if (rocketUserData.profile && rocketUserData.profile.real_name) {
					userUpdate['name'] = rocketUserData.profile.real_name;
				}

				if (rocketUserData.deleted) {
					userUpdate['active'] = false;
					userUpdate['services.resume.loginTokens'] = [];
				}

				RocketChat.models.Users.update({ _id: rocketUserData.rocketId }, { $set: userUpdate });

				const user = RocketChat.models.Users.findOneById(rocketUserData.rocketId);

				let url = null;
				if (rocketUserData.profile) {
					if (rocketUserData.profile.image_original) {
						url = rocketUserData.profile.image_original;
					} else if (rocketUserData.profile.image_512) {
						url = rocketUserData.profile.image_512;
					}
				}
				if (url) {
					try {
						RocketChat.setUserAvatar(user, url, null, 'url');
					} catch (error) {
						logger.rocket.debug('Error setting user avatar', error.message);
					}
				}
			}

			const importIds = [ rocketUserData.id ];
			if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
				importIds.push(rocketUserData.profile.bot_id);
			}
			RocketChat.models.Users.addImportIds(rocketUserData.rocketId, importIds);
			if (!this.userTags[slackUserID]) {
				this.userTags[slackUserID] = { slack: `<@${ slackUserID }>`, rocket: `@${ rocketUserData.name }` };
			}
			return RocketChat.models.Users.findOneById(rocketUserData.rocketId);
		}
		logger.rocket.debug('User not added');
		return;
	}

	addAliasToMsg(rocketUserName, rocketMsgObj) {
		const aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');
		if (aliasFormat) {
			const alias = this.util.format(aliasFormat, rocketUserName);

			if (alias !== rocketUserName) {
				rocketMsgObj.alias = alias;
			}
		}

		return rocketMsgObj;
	}

	createAndSaveMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting) {
		if (slackMessage.type === 'message') {
			let rocketMsgObj = {};
			if (!_.isEmpty(slackMessage.subtype)) {
				rocketMsgObj = this.slack.processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				if (!rocketMsgObj) {
					return;
				}
			} else {
				rocketMsgObj = {
					msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
					rid: rocketChannel._id,
					u: {
						_id: rocketUser._id,
						username: rocketUser.username
					}
				};

				this.addAliasToMsg(rocketUser.username, rocketMsgObj);
			}
			_.extend(rocketMsgObj, rocketMsgDataDefaults);
			if (slackMessage.edited) {
				rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
			}
			if (slackMessage.subtype === 'bot_message') {
				rocketUser = RocketChat.models.Users.findOneById('rocket.cat', { fields: { username: 1 } });
			}

			if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
				rocketMsgObj.pinned = true;
				rocketMsgObj.pinnedAt = Date.now;
				rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
			}
			if (slackMessage.subtype === 'bot_message') {
				Meteor.setTimeout(() => {
					if (slackMessage.bot_id && slackMessage.ts && !RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts)) {
						RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
					}
				}, 500);
			} else {
				logger.rocket.debug('Send message to Rocket.Chat');
				RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
			}
		}
	}

	convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
		if (!_.isEmpty(slackMsgTxt)) {
			slackMsgTxt = slackMsgTxt.replace(/<!everyone>/g, '@all');
			slackMsgTxt = slackMsgTxt.replace(/<!channel>/g, '@all');
			slackMsgTxt = slackMsgTxt.replace(/<!here>/g, '@here');
			slackMsgTxt = slackMsgTxt.replace(/&gt;/g, '>');
			slackMsgTxt = slackMsgTxt.replace(/&lt;/g, '<');
			slackMsgTxt = slackMsgTxt.replace(/&amp;/g, '&');
			slackMsgTxt = slackMsgTxt.replace(/:simple_smile:/g, ':smile:');
			slackMsgTxt = slackMsgTxt.replace(/:memo:/g, ':pencil:');
			slackMsgTxt = slackMsgTxt.replace(/:piggy:/g, ':pig:');
			slackMsgTxt = slackMsgTxt.replace(/:uk:/g, ':gb:');
			slackMsgTxt = slackMsgTxt.replace(/<(http[s]?:[^>]*)>/g, '$1');

			slackMsgTxt.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
				if (!this.userTags[userId]) {
					this.findUser(userId) || this.addUser(userId); // This adds userTags for the userId
				}
				const userTags = this.userTags[userId];
				if (userTags) {
					slackMsgTxt = slackMsgTxt.replace(userTags.slack, userTags.rocket);
				}
			});
		} else {
			slackMsgTxt = '';
		}
		return slackMsgTxt;
	}

}
