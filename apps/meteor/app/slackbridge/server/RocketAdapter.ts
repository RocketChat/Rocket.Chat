import util from 'util';

import type { DeepWritable, IMessage, IRegisterUser, IRoom, IUser, MessageAttachment, RequiredField } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { promiseTimeout } from '@rocket.chat/tools';
import type { BotMessageEvent, MessageEvent } from '@slack/types';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import type { MatchKeysAndValues } from 'mongodb';
import _ from 'underscore';

import type { IMessageSyncedWithSlack, SlackTS } from './definition/IMessageSyncedWithSlack';
import type { IRocketChatAdapter, SlackConversationSyncedWithRocketChat } from './definition/IRocketChatAdapter';
import type { ISlackAdapter } from './definition/ISlackAdapter';
import type { ISlackbridge } from './definition/ISlackbridge';
import type { RocketChatMessageData } from './definition/RocketChatMessageData';
import type { SlackMessageEvent } from './definition/SlackMessageEvent';
import { rocketLogger } from './logger';
import { sleep } from '../../../lib/utils/sleep';
import { replace } from '../../../lib/utils/stringUtils';
import { callbacks } from '../../../server/lib/callbacks';
import { createRoom } from '../../lib/server/functions/createRoom';
import { sendMessage } from '../../lib/server/functions/sendMessage';
import { setUserAvatar } from '../../lib/server/functions/setUserAvatar';
import { settings } from '../../settings/server';

export default class RocketAdapter implements IRocketChatAdapter {
	private _slackAdapters: ISlackAdapter[] = [];

	private util: typeof util;

	private userTags: Record<
		string,
		{
			slack: `<@${string}>`;
			rocket: `@${string}`;
		}
	>;

	public get slackAdapters(): ISlackAdapter[] {
		return this._slackAdapters;
	}

	constructor(private slackBridge: ISlackbridge) {
		rocketLogger.debug('constructor');
		this.slackBridge = slackBridge;
		this.util = util;
		this.userTags = {};
		this._slackAdapters = [];
	}

	connect() {
		this.registerForEvents();
	}

	disconnect() {
		this.unregisterForEvents();
	}

	addSlack(slack: ISlackAdapter) {
		if (this._slackAdapters.indexOf(slack) < 0) {
			this._slackAdapters.push(slack);
		}
	}

	clearSlackAdapters() {
		this._slackAdapters = [];
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
		for await (const slack of this._slackAdapters) {
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

	async onSetReaction(rocketMsg: IMessage, { reaction }: { user: IUser; reaction: string; shouldReact: boolean }) {
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
					for await (const slack of this._slackAdapters) {
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

	async onUnSetReaction(rocketMsg: IMessage, { reaction }: { user: IUser; reaction: string; shouldReact: boolean; oldMessage: IMessage }) {
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
					for await (const slack of this._slackAdapters) {
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

	async onMessage(rocketMessage: IMessageSyncedWithSlack, _params: unknown) {
		for await (const slack of this._slackAdapters) {
			try {
				if (!slack.getSlackChannel(rocketMessage.rid)) {
					// This is on a channel that the rocket bot is not subscribed
					continue;
				}
				rocketLogger.debug({ msg: 'onRocketMessage', rocketMessage });

				if (isEditedMessage(rocketMessage)) {
					// This is an Edit Event
					await this.processMessageChanged(rocketMessage, slack);
					continue;
				}
				// Ignore messages originating from Slack
				if (rocketMessage._id.indexOf('slack-') === 0) {
					continue;
				}

				if (rocketMessage.file) {
					await this.processFileShare(rocketMessage as RequiredField<IMessage, 'file'>, slack);
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

	async processSendMessage(rocketMessage: IMessage, slack: ISlackAdapter) {
		// Since we got this message, SlackBridge_Out_Enabled is true
		if (settings.get('SlackBridge_Out_All') === true) {
			await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
		} else {
			// They want to limit to certain groups
			const outSlackChannels = _.pluck(settings.get<string>('SlackBridge_Out_Channels'), '_id') || [];
			// rocketLogger.debug('Out SlackChannels: ', outSlackChannels);
			if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
				await slack.postMessage(slack.getSlackChannel(rocketMessage.rid), rocketMessage);
			}
		}
	}

	getMessageAttachment(rocketMessage: IMessage): MessageAttachment | undefined {
		if (!rocketMessage.file) {
			return;
		}

		if (!rocketMessage.attachments?.length) {
			return;
		}

		const fileId = rocketMessage.file._id;
		return rocketMessage.attachments.find((attachment) => attachment.title_link && attachment.title_link.indexOf(`/${fileId}/`) >= 0);
	}

	async processFileShare(rocketMessage: RequiredField<IMessage, 'file'>, slack: ISlackAdapter) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}

		if (rocketMessage.file.name) {
			let fileName = rocketMessage.file.name;
			let text: string | undefined = rocketMessage.msg;

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

	async processMessageChanged(rocketMessage: IMessageSyncedWithSlack, slack: ISlackAdapter) {
		if (!rocketMessage) {
			return;
		}

		if (rocketMessage.updatedBySlack) {
			// We have already processed this
			delete rocketMessage.updatedBySlack;
			return;
		}

		// This was a change from Rocket.Chat
		const slackChannel = slack.getSlackChannel(rocketMessage.rid);
		await slack.postMessageUpdate(slackChannel, rocketMessage);
	}

	async getChannel(slackMessage: { channel?: string }): Promise<IRoom | null> {
		if (!slackMessage.channel) {
			return null;
		}

		const channel = await this.findChannel(slackMessage.channel);
		if (channel) {
			return channel;
		}

		return this.addChannel(slackMessage.channel);
	}

	async getUser(slackUser: string): Promise<IRegisterUser | null> {
		if (!slackUser) {
			return null;
		}

		const user = await this.findUser(slackUser);
		if (user) {
			return user;
		}

		return this.addUser(slackUser);
	}

	createRocketID(slackChannel: string, ts: SlackTS): string {
		return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
	}

	async findChannel(slackChannelId: string): Promise<IRoom | null> {
		return Rooms.findOneByImportId(slackChannelId);
	}

	async getRocketUsers(members: string[], slackChannel: SlackConversationSyncedWithRocketChat) {
		const rocketUsers = [];
		for await (const member of members) {
			if (member !== slackChannel.creator) {
				const rocketUser = (await this.findUser(member)) || (await this.addUser(member));
				if (rocketUser?.username) {
					rocketUsers.push(rocketUser.username);
				}
			}
		}
		return rocketUsers;
	}

	async getRocketUserCreator(slackChannel: SlackConversationSyncedWithRocketChat) {
		return slackChannel.creator ? (await this.findUser(slackChannel.creator)) || this.addUser(slackChannel.creator) : null;
	}

	async addChannel(slackChannelID: string, hasRetried = false): Promise<IRoom | null> {
		rocketLogger.debug({ msg: 'Adding Rocket.Chat channel from Slack', slackChannelID });
		let addedRoom = null;

		for await (const slack of this._slackAdapters) {
			if (addedRoom) {
				continue;
			}

			const slackChannel: SlackConversationSyncedWithRocketChat | undefined = await slack.slackAPI.getRoomInfo(slackChannelID);
			if (slackChannel) {
				const members = await slack.slackAPI.getMembers(slackChannelID);
				if (!members) {
					rocketLogger.error('Could not fetch room members');
					continue;
				}

				const { name: slackChannelName } = slackChannel;

				if (!slackChannelName) {
					rocketLogger.debug('Unable to addChannel: slack data is missing channel name.');
					continue;
				}

				const rocketRoom = await Rooms.findOneByName(slackChannelName);

				if (rocketRoom || slackChannel.is_general) {
					slackChannel.rocketId = slackChannel.is_general ? 'GENERAL' : (rocketRoom as IRoom)._id;
					await Rooms.addImportIds(slackChannel.rocketId, [slackChannel.id || slackChannelID]);
				} else {
					const rocketUsers = await this.getRocketUsers(members, slackChannel);
					const rocketUserCreator = await this.getRocketUserCreator(slackChannel);

					if (!rocketUserCreator) {
						rocketLogger.error({ msg: 'Could not fetch room creator information', creator: slackChannel.creator });
						continue;
					}

					try {
						const isPrivate = slackChannel.is_private;
						const rocketChannel = await createRoom(isPrivate ? 'p' : 'c', slackChannelName, rocketUserCreator, rocketUsers);
						slackChannel.rocketId = rocketChannel.rid;
					} catch (e: any) {
						if (!hasRetried) {
							rocketLogger.debug({ msg: 'Error adding channel from Slack. Will retry in 1s.', err: e });
							// If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.
							await sleep(1000);
							return (await this.findChannel(slackChannelID)) || this.addChannel(slackChannelID, true);
						}
						rocketLogger.error({ msg: 'Error adding channel from Slack', err: e });
					}

					const roomUpdate: Record<string, any> = {
						...(slackChannel.created && {
							ts: new Date(slackChannel.created * 1000),
						}),
					};

					let lastSetTopic = 0;
					if (slackChannel.topic?.value) {
						roomUpdate.topic = slackChannel.topic.value;
						if (slackChannel.topic.last_set) {
							lastSetTopic = slackChannel.topic.last_set;
						}
					}

					if (slackChannel.purpose?.value && (slackChannel.purpose.last_set || 0) > lastSetTopic) {
						roomUpdate.topic = slackChannel.purpose.value;
					}
					await Rooms.addImportIds(slackChannel.rocketId as string, [slackChannel.id || slackChannelID]);
					slack.addSlackChannel(slackChannel.rocketId as string, slackChannelID);
				}

				addedRoom = await Rooms.findOneById(slackChannel.rocketId as string);
			}
		}

		if (!addedRoom) {
			rocketLogger.debug('Channel not added');
		}
		return addedRoom;
	}

	async findUser(slackUserID: string): Promise<IRegisterUser | null> {
		const rocketUser = await Users.findOneByImportId(slackUserID);
		if (rocketUser && !this.userTags[slackUserID]) {
			this.userTags[slackUserID] = {
				slack: `<@${slackUserID}>`,
				rocket: `@${rocketUser.username}`,
			};
		}
		return rocketUser as IRegisterUser | null;
	}

	async addUser(slackUserID: string): Promise<IRegisterUser | null> {
		rocketLogger.debug({ msg: 'Adding Rocket.Chat user from Slack', slackUserID });
		let addedUser;
		for await (const slack of this._slackAdapters) {
			if (addedUser) {
				break;
			}

			const user = await slack.slackAPI.getUser(slackUserID);
			if (user) {
				const rocketUserData: Partial<typeof user & { rocketId: string }> = user;
				const isBot = rocketUserData.is_bot === true;
				const email = rocketUserData.profile?.email || '';
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
					const newUser: Parameters<typeof Accounts.createUserAsync>[0] & { joinDefaultChannels?: boolean } = {
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
					const userUpdate: DeepWritable<MatchKeysAndValues<IUser>> = {
						utcOffset: (rocketUserData.tz_offset || 0) / 3600, // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
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
							// added typecast on conversion to TS as this doesn't match any valid signature #TODO
							await setUserAvatar(user as IUser, url, null as any, 'url');
						} catch (err) {
							rocketLogger.debug({ msg: 'Error setting user avatar from Slack', err });
						}
					}
				}

				const importIds = [rocketUserData.id as string];
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
				addedUser = await Users.findOneById<IRegisterUser>(rocketUserData.rocketId);
			}
		}

		if (!addedUser) {
			rocketLogger.debug('User not added');
		}

		return addedUser || null;
	}

	addAliasToMsg(rocketUserName: string, rocketMsgObj: Partial<IMessage>): Partial<IMessage> {
		const { aliasFormat } = this.slackBridge;
		if (aliasFormat) {
			const alias = this.util.format(aliasFormat, rocketUserName);

			if (alias !== rocketUserName) {
				rocketMsgObj.alias = alias;
			}
		}

		return rocketMsgObj;
	}

	async buildMessageObjectFor(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: SlackMessageEvent,
		isImporting: boolean,
		slack: ISlackAdapter,
	): Promise<RocketChatMessageData | void> {
		if (slackMessage.subtype) {
			return slack.processSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);
		}

		const rocketMsgObj = {
			msg: await this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
			rid: rocketChannel._id,
			u: {
				_id: rocketUser._id,
				username: rocketUser.username,
			},
		};

		this.addAliasToMsg(rocketUser.username, rocketMsgObj);
		return rocketMsgObj;
	}

	async sendBotMessage(rocketMsgObj: RocketChatMessageData, rocketChannel: IRoom, slackMessage: BotMessageEvent): Promise<void> {
		const fromUser = await Users.findOneById<Pick<IUser, '_id' | 'username'>>('rocket.cat', { projection: { username: 1 } });

		if (!fromUser) {
			rocketLogger.debug('Unable to save bot message from slack as rocket.cat was not found.');
			return;
		}

		if (rocketMsgObj.pinned) {
			rocketMsgObj.pinnedBy = {
				_id: fromUser._id,
				username: fromUser.username,
			};
		}

		const { bot_id, ts } = slackMessage;

		if (!bot_id || !ts) {
			return;
		}

		await promiseTimeout(500);

		// Make sure that a message with the same bot_id and timestamp doesn't already exists
		const existingMessage = await Messages.findOneBySlackBotIdAndSlackTs(bot_id, ts);
		if (!existingMessage) {
			await sendMessage(fromUser, rocketMsgObj, rocketChannel, true);
		}
	}

	async createAndSaveMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: MessageEvent,
		rocketMsgDataDefaults: Partial<IMessage>,
		isImporting: boolean,
		slack: ISlackAdapter,
	) {
		if (slackMessage.type !== 'message') {
			return;
		}

		const messageData = await this.buildMessageObjectFor(rocketChannel, rocketUser, slackMessage, isImporting, slack);
		if (!messageData) {
			return;
		}

		const threadTs = 'thread_ts' in slackMessage && slackMessage.thread_ts;
		const threadMessage = threadTs && (await Messages.findOneBySlackTs(threadTs));
		const isPinned = 'pinned_to' in slackMessage && slackMessage.pinned_to?.includes(slackMessage.channel);

		const rocketMsgObj: RocketChatMessageData = {
			...messageData,
			...rocketMsgDataDefaults,
			...('edited' in slackMessage &&
				slackMessage.edited && {
					editedAt: new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000),
				}),
			slackTs: slackMessage.ts,
			...(threadMessage && {
				tmid: threadMessage._id,
			}),
			...(isPinned && {
				pinned: true,
				pinnedAt: Date.now(),
				pinnedBy: {
					_id: rocketUser._id,
					username: rocketUser.username,
				},
			}),
		};

		if (slackMessage.subtype === 'bot_message') {
			await this.sendBotMessage(rocketMsgObj, rocketChannel, slackMessage);
		} else {
			rocketLogger.debug('Send message to Rocket.Chat');
			await sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
		}
	}

	async convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt: string | undefined): Promise<string> {
		if (!slackMsgTxt) {
			return '';
		}

		const replacements: [RegExp, string][] = [
			[/<!everyone>/g, '@all'],
			[/<!channel>/g, '@all'],
			[/<!here>/g, '@here'],
			[/&gt;/g, '>'],
			[/&lt;/g, '<'],
			[/&amp;/g, '&'],
			[/:simple_smile:/g, ':smile:'],
			[/:memo:/g, ':pencil:'],
			[/:piggy:/g, ':pig:'],
			[/:uk:/g, ':gb:'],
			[/<(http[s]?:[^>]*)>/g, '$1'],
		];

		const msgWithReplacedTags = replacements.reduce((acc, [reg, str]) => acc.replace(reg, str), slackMsgTxt);

		const regex = /(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g;
		return replace(msgWithReplacedTags, regex, async (match, userId) => {
			if (!this.userTags[userId]) {
				(await this.findUser(userId)) || (await this.addUser(userId)); // This adds userTags for the userId
			}
			const userTags = this.userTags[userId];

			return userTags?.rocket || match;
		});
	}
}
