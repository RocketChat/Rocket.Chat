import util from 'node:util';

import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { ConversationsInfoResponse } from '@slack/web-api';
import _ from 'underscore';

import type SlackAdapter from './SlackAdapter';
import type { BridgedRocketMessage, SlackMessage, SlackBridgeMessage } from './SlackAdapter';
import { rocketLogger } from './logger';
import type { SlackBridgeClass } from './slackbridge';
import { sleep } from '../../../lib/utils/sleep';
import { createUser } from '../../lib/auth/createUser';
import type { CreateUserOptions } from '../../lib/auth/createUser';
import { callbacks } from '../../lib/callbacks';
import { sendMessage } from '../../lib/messages/sendMessage';
import { createRoom } from '../../lib/rooms/createRoom';
import { setUserAvatar } from '../../lib/users/setUserAvatar';
import { getWorkspaceURL } from '../../lib/utils/getURL';
import { settings } from '../../settings';

type SlackRoomInfo = NonNullable<ConversationsInfoResponse['channel']>;

export default class RocketAdapter {
	slackBridge: SlackBridgeClass;

	util: typeof util;

	userTags: Record<string, { slack: string; rocket: string }>;

	slackAdapters: SlackAdapter[];

	constructor(slackBridge: SlackBridgeClass) {
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

	addSlack(slack: SlackAdapter) {
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

	async onMessageDelete(rocketMessageDeleted: IMessage) {
		for (const slack of this.slackAdapters) {
			try {
				if (!slack.getSlackChannel(rocketMessageDeleted.rid)) {
					// This is on a channel that the rocket bot is not subscribed on this slack server
					continue;
				}

				rocketLogger.debug({ msg: 'onRocketMessageDelete', rocketMessageDeleted });
				await slack.postDeleteMessage(rocketMessageDeleted);
			} catch (err) {
				rocketLogger.error({ msg: 'Unhandled error onMessageDelete', err });
			}
		}
	}

	async onSetReaction(rocketMsg: IMessage, { reaction }: { reaction: string }) {
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
					for (const slack of this.slackAdapters) {
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

	async onUnSetReaction(rocketMsg: IMessage, { reaction }: { reaction: string }) {
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
					for (const slack of this.slackAdapters) {
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

	async onMessage(rocketMessage: BridgedRocketMessage) {
		for (const slack of this.slackAdapters) {
			try {
				if (!slack.getSlackChannel(rocketMessage.rid)) {
					// This is on a channel that the rocket bot is not subscribed
					continue;
				}
				rocketLogger.debug({ msg: 'onRocketMessage', rocketMessage });

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

	async processSendMessage(rocketMessage: IMessage, slack: SlackAdapter) {
		// Since we got this message, SlackBridge_Out_Enabled is true
		if (settings.get('SlackBridge_Out_All') === true) {
			await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
		} else {
			// They want to limit to certain groups
			const outSlackChannels = _.pluck(settings.get<{ _id: string }[]>('SlackBridge_Out_Channels'), '_id') || [];
			// rocketLogger.debug('Out SlackChannels: ', outSlackChannels);
			if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
				await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
			}
		}
	}

	getMessageAttachment(rocketMessage: IMessage) {
		if (!rocketMessage.file) {
			return;
		}

		if (!rocketMessage.attachments?.length) {
			return;
		}

		const fileId = rocketMessage.file._id;
		return rocketMessage.attachments.find(
			(attachment) => 'title_link' in attachment && attachment.title_link && attachment.title_link.indexOf(`/${fileId}/`) >= 0,
		);
	}

	async processFileShare(rocketMessage: IMessage, slack: SlackAdapter) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}

		if (rocketMessage.file?.name) {
			let fileName = rocketMessage.file.name;
			let text = rocketMessage.msg;

			const attachment = this.getMessageAttachment(rocketMessage);
			if (attachment && 'title_link' in attachment && attachment.title_link) {
				fileName = getWorkspaceURL(attachment.title_link);
				if (!text) {
					text = attachment.description ?? '';
				}
			}

			await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), { ...rocketMessage, msg: `${text} ${fileName}` });
		}
	}

	async processMessageChanged(rocketMessage: BridgedRocketMessage, slack: SlackAdapter) {
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

	async getChannel(slackMessage: Pick<SlackMessage, 'channel'>) {
		return slackMessage.channel ? (await this.findChannel(slackMessage.channel)) || this.addChannel(slackMessage.channel) : null;
	}

	async getUser(slackUser?: string) {
		return slackUser ? (await this.findUser(slackUser)) || this.addUser(slackUser) : null;
	}

	createRocketID(slackChannel: string, ts: string) {
		return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
	}

	async findChannel(slackChannelId: string) {
		return Rooms.findOneByImportId(slackChannelId);
	}

	async getRocketUsers(members: string[], slackChannel: SlackRoomInfo) {
		const rocketUsers: string[] = [];
		for (const member of members) {
			if (member !== slackChannel.creator) {
				const rocketUser = (await this.findUser(member)) || (await this.addUser(member));
				if (rocketUser?.username) {
					rocketUsers.push(rocketUser.username);
				}
			}
		}
		return rocketUsers;
	}

	async getRocketUserCreator(slackChannel: SlackRoomInfo) {
		return slackChannel.creator ? (await this.findUser(slackChannel.creator)) || this.addUser(slackChannel.creator) : null;
	}

	async addChannel(slackChannelID: string, hasRetried = false): Promise<IRoom | null | undefined> {
		rocketLogger.debug({ msg: 'Adding Rocket.Chat channel from Slack', slackChannelID });
		let addedRoom: IRoom | null | undefined;

		for (const slack of this.slackAdapters) {
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

				const rocketRoom = slackChannel.name ? await Rooms.findOneByName(slackChannel.name) : null;
				let rocketId: string | undefined;

				if (rocketRoom || slackChannel.is_general) {
					rocketId = slackChannel.is_general || !rocketRoom ? 'GENERAL' : rocketRoom._id;
					await Rooms.addImportIds(rocketId, [slackChannelID]);
				} else {
					const rocketUsers = await this.getRocketUsers(members, slackChannel);
					const rocketUserCreator = await this.getRocketUserCreator(slackChannel);

					if (!rocketUserCreator) {
						rocketLogger.error({ msg: 'Could not fetch room creator information', creator: slackChannel.creator });
						continue;
					}

					try {
						const isPrivate = slackChannel.is_private;
						const rocketChannel = await createRoom(isPrivate ? 'p' : 'c', slackChannel.name ?? '', rocketUserCreator, rocketUsers);
						rocketId = rocketChannel.rid;
					} catch (e) {
						if (!hasRetried) {
							rocketLogger.debug({ msg: 'Error adding channel from Slack. Will retry in 1s.', err: e });
							// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
							await sleep(1000);
							return (await this.findChannel(slackChannelID)) || this.addChannel(slackChannelID, true);
						}
						rocketLogger.error({ msg: 'Error adding channel from Slack', err: e });
					}

					const roomUpdate: Partial<IRoom> = {
						ts: new Date((slackChannel.created ?? 0) * 1000),
					};

					let lastSetTopic = 0;
					if (slackChannel.topic?.value) {
						roomUpdate.topic = slackChannel.topic.value;
						lastSetTopic = slackChannel.topic.last_set ?? 0;
					}

					if (slackChannel.purpose?.value && (slackChannel.purpose.last_set ?? 0) > lastSetTopic) {
						roomUpdate.topic = slackChannel.purpose.value;
					}
					if (!rocketId) {
						continue;
					}
					await Rooms.addImportIds(rocketId, [slackChannelID]);
					slack.addSlackChannel(rocketId, slackChannelID);
				}

				addedRoom = await Rooms.findOneById(rocketId);
			}
		}

		if (!addedRoom) {
			rocketLogger.debug('Channel not added');
		}
		return addedRoom;
	}

	async findUser(slackUserID: string) {
		const rocketUser = await Users.findOneByImportId(slackUserID);
		if (rocketUser && !this.userTags[slackUserID]) {
			this.userTags[slackUserID] = {
				slack: `<@${slackUserID}>`,
				rocket: `@${rocketUser.username}`,
			};
		}
		return rocketUser;
	}

	async addUser(slackUserID: string): Promise<IUser | null | undefined> {
		rocketLogger.debug({ msg: 'Adding Rocket.Chat user from Slack', slackUserID });
		let addedUser: IUser | null | undefined;
		for (const slack of this.slackAdapters) {
			if (addedUser) {
				return;
			}

			const user = await slack.slackAPI.getUser(slackUserID);
			if (user) {
				const rocketUserData: typeof user & { rocketId?: string } = user;
				const isBot = rocketUserData.is_bot === true;
				const email = rocketUserData.profile?.email || '';
				let existingRocketUser;
				if (!isBot) {
					existingRocketUser =
						(await Users.findOneByEmailAddress(email)) || (await Users.findOneByUsernameIgnoringCase(rocketUserData.name ?? ''));
				} else {
					existingRocketUser = await Users.findOneByUsernameIgnoringCase(rocketUserData.name ?? '');
				}

				if (existingRocketUser) {
					rocketUserData.rocketId = existingRocketUser._id;
					rocketUserData.name = existingRocketUser.username;
				} else {
					const newUser: CreateUserOptions = {
						password: Random.id(),
						username: rocketUserData.name,
					};

					if (!isBot && email) {
						newUser.email = email;
					}

					if (isBot) {
						newUser.joinDefaultChannels = false;
					}

					rocketUserData.rocketId = await createUser(newUser);
					const userUpdate: Record<string, unknown> = {
						utcOffset: (rocketUserData.tz_offset ?? 0) / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
						roles: isBot ? ['bot'] : ['user'],
					};

					if (rocketUserData.profile?.real_name) {
						userUpdate.name = rocketUserData.profile.real_name;
					}

					if (rocketUserData.deleted) {
						userUpdate.active = false;
						userUpdate['services.resume.loginTokens'] = [];
					}

					await Users.updateOne({ _id: rocketUserData.rocketId }, { $set: userUpdate });

					const user = await Users.findOneById(rocketUserData.rocketId);

					let url: string | undefined;
					if (rocketUserData.profile) {
						if (rocketUserData.profile.image_original) {
							url = rocketUserData.profile.image_original;
						} else if (rocketUserData.profile.image_512) {
							url = rocketUserData.profile.image_512;
						}
					}
					if (user && url) {
						try {
							await setUserAvatar(user, url, undefined, 'url');
						} catch (err) {
							rocketLogger.debug({ msg: 'Error setting user avatar from Slack', err });
						}
					}
				}

				const importIds = [slackUserID];
				if (isBot && rocketUserData.profile?.bot_id) {
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

	addAliasToMsg<T extends SlackBridgeMessage>(rocketUserName: string | undefined, rocketMsgObj: T): T {
		const aliasFormat = settings.get<string>('SlackBridge_AliasFormat');
		if (aliasFormat) {
			const alias = this.util.format(aliasFormat, rocketUserName);

			if (alias !== rocketUserName) {
				rocketMsgObj.alias = alias;
			}
		}

		return rocketMsgObj;
	}

	async createAndSaveMessage(
		rocketChannel: IRoom,
		rocketUser: IUser | null,
		slackMessage: SlackMessage,
		rocketMsgDataDefaults: SlackBridgeMessage,
		isImporting: boolean,
		slack: SlackAdapter,
	) {
		if (slackMessage.type === 'message' && rocketUser) {
			let rocketMsgObj: SlackBridgeMessage | undefined = {};
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
						username: rocketUser.username ?? '',
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
				rocketUser = await Users.findOneById('rocket.cat');
			}
			if (!rocketUser) {
				return;
			}

			if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
				rocketMsgObj.pinned = true;
				rocketMsgObj.pinnedAt = new Date();
				rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
			}
			if (slackMessage.subtype === 'bot_message') {
				setTimeout(async () => {
					if (slackMessage.bot_id && slackMessage.ts) {
						// Make sure that a message with the same bot_id and timestamp doesn't already exists
						const msg = await Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts);
						if (!msg) {
							void sendMessage(rocketUser, rocketMsgObj, rocketChannel, { upsert: true });
						}
					}
				}, 500);
			} else {
				rocketLogger.debug('Send message to Rocket.Chat');
				await sendMessage(rocketUser, rocketMsgObj, rocketChannel, { upsert: true });
			}
		}
	}

	async convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt?: string) {
		const regex = /(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g;
		if (slackMsgTxt) {
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

			const userIds = new Set(Array.from(slackMsgTxt.matchAll(regex), ([, userId]) => userId));
			for (const userId of userIds) {
				if (!this.userTags[userId] && !(await this.findUser(userId))) {
					await this.addUser(userId);
				}
			}

			slackMsgTxt = slackMsgTxt.replace(regex, (match, userId: string) => this.userTags[userId]?.rocket ?? match);
		} else {
			slackMsgTxt = '';
		}
		return slackMsgTxt;
	}
}
