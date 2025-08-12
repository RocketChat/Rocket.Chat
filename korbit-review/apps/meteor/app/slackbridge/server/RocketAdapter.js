import util from 'util';

import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { rocketLogger } from './logger';
import { callbacks } from '../../../lib/callbacks';
import { sleep } from '../../../lib/utils/sleep';
import { createRoom } from '../../lib/server/functions/createRoom';
import { sendMessage } from '../../lib/server/functions/sendMessage';
import { setUserAvatar } from '../../lib/server/functions/setUserAvatar';
import { settings } from '../../settings/server';

export default class RocketAdapter {
	constructor(slackBridge) {
		rocketLogger.debug('constructor');
		this.slackBridge = slackBridge;
		this.util = util;
		this.userTags = {};
		this.slackAdapters = [];
	}

	connect() {
		this.registerForEvents();
	}

	disconnect() {
		this.unregisterForEvents();
	}

	addSlack(slack) {
		if (this.slackAdapters.indexOf(slack) < 0) {
			this.slackAdapters.push(slack);
		}
	}

	clearSlackAdapters() {
		this.slackAdapters = [];
	}

	registerForEvents() {
		rocketLogger.debug('Register for events');
		callbacks.add('afterSaveMessage', this.onMessage.bind(this), callbacks.priority.LOW, 'SlackBridge_Out');
		callbacks.add('afterDeleteMessage', this.onMessageDelete.bind(this), callbacks.priority.LOW, 'SlackBridge_Delete');
		callbacks.add('afterSetReaction', this.onSetReaction.bind(this), callbacks.priority.LOW, 'SlackBridge_SetReaction');
		callbacks.add('afterUnsetReaction', this.onUnSetReaction.bind(this), callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
	}

	unregisterForEvents() {
		rocketLogger.debug('Unregister for events');
		callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
		callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
		callbacks.remove('afterSetReaction', 'SlackBridge_SetReaction');
		callbacks.remove('afterUnsetReaction', 'SlackBridge_UnSetReaction');
	}

	async onMessageDelete(rocketMessageDeleted) {
		for await (const slack of this.slackAdapters) {
			try {
				if (!slack.getSlackChannel(rocketMessageDeleted.rid)) {
					// This is on a channel that the rocket bot is not subscribed on this slack server
					continue;
				}

				rocketLogger.debug('onRocketMessageDelete', rocketMessageDeleted);
				await slack.postDeleteMessage(rocketMessageDeleted);
			} catch (err) {
				rocketLogger.error({ msg: 'Unhandled error onMessageDelete', err });
			}
		}
	}

	async onSetReaction(rocketMsg, { reaction }) {
		try {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}

			rocketLogger.debug('onRocketSetReaction');

			if (rocketMsg._id && reaction) {
				if (this.slackBridge.reactionsMap.delete(`set${rocketMsg._id}${reaction}`)) {
					// This was a Slack reaction, we don't need to tell Slack about it
					return;
				}
				if (rocketMsg) {
					for await (const slack of this.slackAdapters) {
						const slackChannel = slack.getSlackChannel(rocketMsg.rid);
						if (slackChannel != null) {
							const slackTS = slack.getTimeStamp(rocketMsg);
							await slack.postReactionAdded(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
						}
					}
				}
			}
		} catch (err) {
			rocketLogger.error({ msg: 'Unhandled error onSetReaction', err });
		}
	}

	async onUnSetReaction(rocketMsg, { reaction }) {
		try {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}

			rocketLogger.debug('onRocketUnSetReaction');

			if (rocketMsg._id && reaction) {
				if (this.slackBridge.reactionsMap.delete(`unset${rocketMsg._id}${reaction}`)) {
					// This was a Slack unset reaction, we don't need to tell Slack about it
					return;
				}

				if (rocketMsg) {
					for await (const slack of this.slackAdapters) {
						const slackChannel = slack.getSlackChannel(rocketMsg.rid);
						if (slackChannel != null) {
							const slackTS = slack.getTimeStamp(rocketMsg);
							await slack.postReactionRemove(reaction.replace(/:/g, ''), slackChannel.id, slackTS);
						}
					}
				}
			}
		} catch (err) {
			rocketLogger.error({ msg: 'Unhandled error onUnSetReaction', err });
		}
	}

	async onMessage(rocketMessage) {
		for await (const slack of this.slackAdapters) {
			try {
				if (!slack.getSlackChannel(rocketMessage.rid)) {
					// This is on a channel that the rocket bot is not subscribed
					continue;
				}
				rocketLogger.debug('onRocketMessage', rocketMessage);

				if (rocketMessage.editedAt) {
					// This is an Edit Event
					await this.processMessageChanged(rocketMessage, slack);
					continue;
				}
				// Ignore messages originating from Slack
				if (rocketMessage._id.indexOf('slack-') === 0) {
					continue;
				}

				if (rocketMessage.file) {
					await this.processFileShare(rocketMessage, slack);
					continue;
				}

				// A new message from Rocket.Chat
				await this.processSendMessage(rocketMessage, slack);
			} catch (err) {
				rocketLogger.error({ msg: 'Unhandled error onMessage', err });
			}
		}

		return rocketMessage;
	}

	async processSendMessage(rocketMessage, slack) {
		// Since we got this message, SlackBridge_Out_Enabled is true
		if (settings.get('SlackBridge_Out_All') === true) {
			await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
		} else {
			// They want to limit to certain groups
			const outSlackChannels = _.pluck(settings.get('SlackBridge_Out_Channels'), '_id') || [];
			// rocketLogger.debug('Out SlackChannels: ', outSlackChannels);
			if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
				await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
			}
		}
	}

	getMessageAttachment(rocketMessage) {
		if (!rocketMessage.file) {
			return;
		}

		if (!rocketMessage.attachments || !rocketMessage.attachments.length) {
			return;
		}

		const fileId = rocketMessage.file._id;
		return rocketMessage.attachments.find((attachment) => attachment.title_link && attachment.title_link.indexOf(`/${fileId}/`) >= 0);
	}

	async processFileShare(rocketMessage, slack) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}

		if (rocketMessage.file.name) {
			let fileName = rocketMessage.file.name;
			let text = rocketMessage.msg;

			const attachment = this.getMessageAttachment(rocketMessage);
			if (attachment) {
				fileName = Meteor.absoluteUrl(attachment.title_link);
				if (!text) {
					text = attachment.description;
				}
			}

			await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), { ...rocketMessage, msg: `${text} ${fileName}` });
		}
	}

	async processMessageChanged(rocketMessage, slack) {
		if (rocketMessage) {
			if (rocketMessage.updatedBySlack) {
				// We have already processed this
				delete rocketMessage.updatedBySlack;
				return;
			}

			// This was a change from Rocket.Chat
			const slackChannel = slack.getSlackChannel(rocketMessage.rid);
			await slack.postMessageUpdate(slackChannel, rocketMessage);
		}
	}

	async getChannel(slackMessage) {
		return slackMessage.channel ? (await this.findChannel(slackMessage.channel)) || this.addChannel(slackMessage.channel) : null;
	}

	async getUser(slackUser) {
		return slackUser ? (await this.findUser(slackUser)) || this.addUser(slackUser) : null;
	}

	createRocketID(slackChannel, ts) {
		return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
	}

	async findChannel(slackChannelId) {
		return Rooms.findOneByImportId(slackChannelId);
	}

	async getRocketUsers(members, slackChannel) {
		const rocketUsers = [];
		for await (const member of members) {
			if (member !== slackChannel.creator) {
				const rocketUser = (await this.findUser(member)) || (await this.addUser(member));
				if (rocketUser && rocketUser.username) {
					rocketUsers.push(rocketUser.username);
				}
			}
		}
		return rocketUsers;
	}

	async getRocketUserCreator(slackChannel) {
		return slackChannel.creator ? (await this.findUser(slackChannel.creator)) || this.addUser(slackChannel.creator) : null;
	}

	async addChannel(slackChannelID, hasRetried = false) {
		rocketLogger.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
		let addedRoom;

		for await (const slack of this.slackAdapters) {
			if (addedRoom) {
				continue;
			}

			const slackChannel = await slack.slackAPI.getRoomInfo(slackChannelID);
			if (slackChannel) {
				const members = await slack.slackAPI.getMembers(slackChannelID);
				if (!members) {
					rocketLogger.error('Could not fetch room members');
					continue;
				}

				const rocketRoom = await Rooms.findOneByName(slackChannel.name);

				if (rocketRoom || slackChannel.is_general) {
					slackChannel.rocketId = slackChannel.is_general ? 'GENERAL' : rocketRoom._id;
					await Rooms.addImportIds(slackChannel.rocketId, slackChannel.id);
				} else {
					const rocketUsers = await this.getRocketUsers(members, slackChannel);
					const rocketUserCreator = await this.getRocketUserCreator(slackChannel);

					if (!rocketUserCreator) {
						rocketLogger.error({ msg: 'Could not fetch room creator information', creator: slackChannel.creator });
						continue;
					}

					try {
						const isPrivate = slackChannel.is_private;
						const rocketChannel = await createRoom(isPrivate ? 'p' : 'c', slackChannel.name, rocketUserCreator, rocketUsers);
						slackChannel.rocketId = rocketChannel.rid;
					} catch (e) {
						if (!hasRetried) {
							rocketLogger.debug('Error adding channel from Slack. Will retry in 1s.', e.message);
							// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
							await sleep(1000);
							return (await this.findChannel(slackChannelID)) || this.addChannel(slackChannelID, true);
						}
						rocketLogger.error(e);
					}

					const roomUpdate = {
						ts: new Date(slackChannel.created * 1000),
					};

					let lastSetTopic = 0;
					if (slackChannel.topic && slackChannel.topic.value) {
						roomUpdate.topic = slackChannel.topic.value;
						lastSetTopic = slackChannel.topic.last_set;
					}

					if (slackChannel.purpose && slackChannel.purpose.value && slackChannel.purpose.last_set > lastSetTopic) {
						roomUpdate.topic = slackChannel.purpose.value;
					}
					await Rooms.addImportIds(slackChannel.rocketId, slackChannel.id);
					slack.addSlackChannel(slackChannel.rocketId, slackChannelID);
				}

				addedRoom = await Rooms.findOneById(slackChannel.rocketId);
			}
		}

		if (!addedRoom) {
			rocketLogger.debug('Channel not added');
		}
		return addedRoom;
	}

	async findUser(slackUserID) {
		const rocketUser = await Users.findOneByImportId(slackUserID);
		if (rocketUser && !this.userTags[slackUserID]) {
			this.userTags[slackUserID] = {
				slack: `<@${slackUserID}>`,
				rocket: `@${rocketUser.username}`,
			};
		}
		return rocketUser;
	}

	async addUser(slackUserID) {
		rocketLogger.debug('Adding Rocket.Chat user from Slack', slackUserID);
		let addedUser;
		for await (const slack of this.slackAdapters) {
			if (addedUser) {
				return;
			}

			const user = await slack.slackAPI.getUser(slackUserID);
			if (user) {
				const rocketUserData = user;
				const isBot = rocketUserData.is_bot === true;
				const email = (rocketUserData.profile && rocketUserData.profile.email) || '';
				let existingRocketUser;
				if (!isBot) {
					existingRocketUser =
						(await Users.findOneByEmailAddress(email)) || (await Users.findOneByUsernameIgnoringCase(rocketUserData.name));
				} else {
					existingRocketUser = await Users.findOneByUsernameIgnoringCase(rocketUserData.name);
				}

				if (existingRocketUser) {
					rocketUserData.rocketId = existingRocketUser._id;
					rocketUserData.name = existingRocketUser.username;
				} else {
					const newUser = {
						password: Random.id(),
						username: rocketUserData.name,
					};

					if (!isBot && email) {
						newUser.email = email;
					}

					if (isBot) {
						newUser.joinDefaultChannels = false;
					}

					rocketUserData.rocketId = await Accounts.createUserAsync(newUser);
					const userUpdate = {
						utcOffset: rocketUserData.tz_offset / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
						roles: isBot ? ['bot'] : ['user'],
					};

					if (rocketUserData.profile && rocketUserData.profile.real_name) {
						userUpdate.name = rocketUserData.profile.real_name;
					}

					if (rocketUserData.deleted) {
						userUpdate.active = false;
						userUpdate['services.resume.loginTokens'] = [];
					}

					await Users.updateOne({ _id: rocketUserData.rocketId }, { $set: userUpdate });

					const user = await Users.findOneById(rocketUserData.rocketId);

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
							await setUserAvatar(user, url, null, 'url');
						} catch (error) {
							rocketLogger.debug('Error setting user avatar', error.message);
						}
					}
				}

				const importIds = [rocketUserData.id];
				if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
					importIds.push(rocketUserData.profile.bot_id);
				}
				await Users.addImportIds(rocketUserData.rocketId, importIds);
				if (!this.userTags[slackUserID]) {
					this.userTags[slackUserID] = {
						slack: `<@${slackUserID}>`,
						rocket: `@${rocketUserData.name}`,
					};
				}
				addedUser = await Users.findOneById(rocketUserData.rocketId);
			}
		}

		if (!addedUser) {
			rocketLogger.debug('User not added');
		}

		return addedUser;
	}

	addAliasToMsg(rocketUserName, rocketMsgObj) {
		const aliasFormat = settings.get('SlackBridge_AliasFormat');
		if (aliasFormat) {
			const alias = this.util.format(aliasFormat, rocketUserName);

			if (alias !== rocketUserName) {
				rocketMsgObj.alias = alias;
			}
		}

		return rocketMsgObj;
	}

	async createAndSaveMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting, slack) {
		if (slackMessage.type === 'message') {
			let rocketMsgObj = {};
			if (!_.isEmpty(slackMessage.subtype)) {
				rocketMsgObj = await slack.processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);
				if (!rocketMsgObj) {
					return;
				}
			} else {
				rocketMsgObj = {
					msg: await this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
					rid: rocketChannel._id,
					u: {
						_id: rocketUser._id,
						username: rocketUser.username,
					},
				};

				this.addAliasToMsg(rocketUser.username, rocketMsgObj);
			}
			_.extend(rocketMsgObj, rocketMsgDataDefaults);
			if (slackMessage.edited) {
				rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
			}
			rocketMsgObj.slackTs = slackMessage.ts;
			if (slackMessage.thread_ts) {
				const tmessage = await Messages.findOneBySlackTs(slackMessage.thread_ts);
				if (tmessage) {
					rocketMsgObj.tmid = tmessage._id;
				}
			}
			if (slackMessage.subtype === 'bot_message') {
				rocketUser = await Users.findOneById('rocket.cat', { projection: { username: 1 } });
			}

			if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
				rocketMsgObj.pinned = true;
				rocketMsgObj.pinnedAt = Date.now;
				rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
			}
			if (slackMessage.subtype === 'bot_message') {
				setTimeout(async () => {
					if (slackMessage.bot_id && slackMessage.ts) {
						// Make sure that a message with the same bot_id and timestamp doesn't already exists
						const msg = await Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts);
						if (!msg) {
							void sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
						}
					}
				}, 500);
			} else {
				rocketLogger.debug('Send message to Rocket.Chat');
				await sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
			}
		}
	}

	async convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
		const regex = /(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g;
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

			const promises = [];

			slackMsgTxt.replace(regex, async (match, userId) => {
				if (!this.userTags[userId]) {
					(await this.findUser(userId)) || (await this.addUser(userId)); // This adds userTags for the userId
				}
				const userTags = this.userTags[userId];
				if (userTags) {
					promises.push(slackMsgTxt.replace(userTags.slack, userTags.rocket));
				}
			});

			const result = await Promise.all(promises);
			slackMsgTxt = slackMsgTxt.replace(regex, () => result.shift());
		} else {
			slackMsgTxt = '';
		}
		return slackMsgTxt;
	}
}
