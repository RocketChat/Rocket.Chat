import { Message } from '@rocket.chat/core-services';
import type { FileAttachmentProps, IMessage, IRegisterUser, IRoom, IUpload, FileProp } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users, ReadReceipts } from '@rocket.chat/models';
import type {
	BotMessageEvent,
	ChannelJoinMessageEvent,
	ChannelLeaveMessageEvent,
	ChannelNameMessageEvent,
	ChannelPurposeMessageEvent,
	ChannelTopicMessageEvent,
	FileShareMessageEvent,
	GenericMessageEvent,
	MeMessageEvent,
	MessageChangedEvent,
	MessageDeletedEvent,
	ChannelLeftEvent,
	ReactionAddedEvent,
	ReactionRemovedEvent,
	MemberJoinedChannelEvent,
} from '@slack/types';
import type { ChatUpdateArguments, ConversationsHistoryArguments, ConversationsListResponse } from '@slack/web-api';
import { Meteor } from 'meteor/meteor';

import type { IMessageSyncedWithSlack, SlackTS } from './definition/IMessageSyncedWithSlack';
import { isMessageImportedFromSlack } from './definition/IMessageSyncedWithSlack';
import type { IRocketChatAdapter } from './definition/IRocketChatAdapter';
import type { ISlackAPI, SlackPostMessage } from './definition/ISlackAPI';
import type { ISlackAdapter, SlackAppCredentials, SlackChannel } from './definition/ISlackAdapter';
import type { ISlackbridge } from './definition/ISlackbridge';
import type { RocketChatMessageData } from './definition/RocketChatMessageData';
import type {
	FileCommentMessageEvent,
	FileMentionMessageEvent,
	GroupJoinMessageEvent,
	GroupLeaveMessageEvent,
	GroupNameMessageEvent,
	GroupPurposeMessageEvent,
	GroupTopicMessageEvent,
	PinnedItemMessageEvent,
	SlackMessageEvent,
} from './definition/SlackMessageEvent';
import { slackLogger } from './logger';
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

export default abstract class SlackAdapter implements ISlackAdapter {
	protected _slackAPI: ISlackAPI | null = null;

	protected messagesBeingSent: SlackPostMessage[];

	private slackChannelRocketBotMembershipMap = new Map<string, SlackChannel>();

	private slackBotId: string | false;

	public get slackAPI(): ISlackAPI {
		return this._slackAPI as ISlackAPI;
	}

	constructor(
		protected slackBridge: ISlackbridge,
		protected rocket: IRocketChatAdapter,
	) {
		slackLogger.debug({ msg: 'constructor' });

		// On Slack, a rocket integration bot will be added to slack channels, this is the list of those channels, key is Rocket Ch ID
		this.slackChannelRocketBotMembershipMap = new Map(); // Key=RocketChannelID, Value=SlackChannel
		this.messagesBeingSent = [];
		this.slackBotId = false;
	}

	async connect({ apiToken, appCredential }: { apiToken?: string; appCredential?: SlackAppCredentials }) {
		try {
			const connectResult = await (appCredential ? this.connectApp(appCredential) : this.connectLegacy(apiToken as string));

			if (connectResult) {
				slackLogger.info({ msg: 'Connected to Slack' });
				slackLogger.debug({ msg: 'Slack connection result', connectResult });
				Meteor.startup(async () => {
					try {
						await this.populateMembershipChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
					} catch (err: any) {
						slackLogger.error({ msg: 'Error attempting to connect to Slack', err });
						if (err.data.error === 'invalid_auth') {
							slackLogger.error('The provided token is invalid');
						}
						// Using "void" because the JS code didn't have anything
						void this.slackBridge.disconnect();
					}
				});
			}
		} catch (err) {
			slackLogger.error({ msg: 'Error attempting to connect to Slack', err });
			// Using "void" because the JS code didn't have anything
			void this.slackBridge.disconnect();
		}
	}

	abstract connectApp(appCredential: SlackAppCredentials): Promise<boolean>;

	abstract connectLegacy(apiToken: string): Promise<boolean>;

	/**
	 * Unregister for slack events and disconnect from Slack
	 */
	abstract disconnect(): Promise<void>;

	abstract registerForEvents(): void;

	/*
	 https://api.slack.com/events/reaction_removed
	 */
	async onReactionRemoved(slackReactionMsg: ReactionRemovedEvent) {
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
				const theReaction = rocketMsg.reactions?.[rocketReaction];

				// If the Rocket user has already been removed, then this is an echo back from slack
				if (rocketMsg.reactions && theReaction) {
					if (rocketUser.roles.includes('bot')) {
						return;
					}
					if (rocketUser.username && !theReaction.usernames.includes(rocketUser.username)) {
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
	async onReactionAdded(slackReactionMsg: ReactionAddedEvent) {
		if (slackReactionMsg) {
			if (!this.slackBridge.isReactionsEnabled) {
				return;
			}
			const rocketUser = await this.rocket.getUser(slackReactionMsg.user);

			if (rocketUser?.roles.includes('bot')) {
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
					if (rocketUser.username && theReaction?.usernames.includes(rocketUser.username)) {
						return; // Already reacted
					}
				}

				// Stash this away to key off it later so we don't send it back to Slack
				this.slackBridge.reactionsMap.set(`set${rocketMsg._id}${rocketReaction}`, rocketUser);
				slackLogger.debug('Adding reaction from Slack');
				await executeSetReaction(rocketUser._id, rocketReaction, rocketMsg._id);
			}
		}
	}

	onChannelLeft(channelLeftMsg: ChannelLeftEvent) {
		this.removeSlackChannel(channelLeftMsg.channel);
	}

	/**
	 * We have received a message from slack and we need to save/delete/update it into rocket
	 * https://api.slack.com/events/message
	 */
	async onMessage(slackMessage: SlackMessageEvent, isImporting?: boolean) {
		const isAFileShare = 'files' in slackMessage && slackMessage?.files && Array.isArray(slackMessage.files) && slackMessage.files.length;
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

	async postFindChannel(rocketChannelName: string) {
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
	getTimeStamp(rocketMsg: IMessage): SlackTS | undefined {
		// slack-G3KJGGE15-1483081061-000169
		if (isMessageImportedFromSlack(rocketMsg)) {
			// This is a msg that originated from Slack
			let slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
			const index = slackTS.indexOf('-');
			slackTS = slackTS.substr(index + 1, slackTS.length);
			return slackTS.replace('-', '.');
		}

		// This probably originated as a Rocket msg, but has been sent to Slack
		return (rocketMsg as IMessageSyncedWithSlack).slackTs;
	}

	/**
	 * Adds a slack channel to our collection that the rocketbot is a member of on slack
	 * @param rocketChID
	 * @param slackChID
	 */
	addSlackChannel(rocketChID: string, slackChID: SlackChannel['id']) {
		const ch = this.getSlackChannel(rocketChID);
		if (ch == null) {
			slackLogger.debug({ msg: 'Added channel', rocketChID, slackChID });
			this.slackChannelRocketBotMembershipMap.set(rocketChID, {
				id: slackChID,
				family: slackChID.charAt(0) === 'C' ? 'channels' : 'groups',
			});
		}
	}

	removeSlackChannel(slackChID: SlackChannel['id']) {
		const keys = this.slackChannelRocketBotMembershipMap.keys();
		let key;
		while ((key = keys.next().value) != null) {
			const slackChannel = this.slackChannelRocketBotMembershipMap.get(key);
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

	private async populateMembershipChannelMapByChannels(channels?: Required<ConversationsListResponse>['channels']) {
		if (!channels?.length) {
			return;
		}

		for await (const slackChannel of channels) {
			if (!(slackChannel.name || slackChannel.id) || !slackChannel.is_member) {
				continue;
			}

			const rcRoom =
				(slackChannel.name && (await Rooms.findOneByName(slackChannel.name, { projection: { _id: 1 } }))) ||
				(slackChannel.id && (await Rooms.findOneByImportId(slackChannel.id, { projection: { _id: 1 } }))) ||
				undefined;

			if (rcRoom) {
				this.addSlackChannel(rcRoom._id, (slackChannel.id || slackChannel.name) as string);
			}
		}
	}

	async populateMembershipChannelMap() {
		slackLogger.debug('Populating channel map');
		await this.populateMembershipChannelMapByChannels(await this.slackAPI.getChannels());
		await this.populateMembershipChannelMapByChannels(await this.slackAPI.getGroups());
	}

	/*
	 https://api.slack.com/methods/reactions.add
	 */
	async postReactionAdded(reaction: string, slackChannel: string, slackTS: SlackTS) {
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
	async postReactionRemove(reaction: string, slackChannel: string, slackTS: SlackTS) {
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
		if (!rocketMessage) {
			return;
		}

		const slackChannel = this.getSlackChannel(rocketMessage.rid);
		if (!slackChannel) {
			return;
		}

		const ts = this.getTimeStamp(rocketMessage);
		if (!ts) {
			slackLogger.debug('Not posting message deletion to slack because the message doesnt have a slack timestamp');
			return;
		}

		const data = {
			ts,
			channel: slackChannel.id,
			as_user: true,
		};

		slackLogger.debug({ msg: 'Post Delete Message to Slack', data });
		const postResult = await this.slackAPI.removeMessage(data);
		if (postResult) {
			slackLogger.debug('Message deleted on Slack');
		}
	}

	storeMessageBeingSent(data: SlackPostMessage) {
		this.messagesBeingSent.push(data);
	}

	removeMessageBeingSent(data: SlackPostMessage) {
		const idx = this.messagesBeingSent.indexOf(data);
		if (idx >= 0) {
			this.messagesBeingSent.splice(idx, 1);
		}
	}

	isMessageBeingSent(username: string, channel: string) {
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

	createSlackMessageId(ts: string, channelId?: string): string {
		return `slack${channelId ? `-${channelId}` : ''}-${ts.replace(/\./g, '-')}`;
	}

	async postMessage(slackChannel: SlackChannel | undefined, rocketMessage: IMessage): Promise<void> {
		if (!slackChannel?.id) {
			return;
		}

		let iconUrl = getUserAvatarURL(rocketMessage.u?.username);
		if (iconUrl) {
			iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
		}
		const data: SlackPostMessage = {
			text: rocketMessage.msg,
			channel: slackChannel.id,
			username: rocketMessage.u?.username,
			icon_url: iconUrl,
			link_names: true,
		};

		if (rocketMessage.tmid) {
			const tmessage = await Messages.findOneById<IMessageSyncedWithSlack>(rocketMessage.tmid);
			if (tmessage?.slackTs) {
				data.thread_ts = tmessage.slackTs;
			}
		}
		slackLogger.debug({ msg: 'Post Message To Slack', data });

		// If we don't have the bot id yet and we have multiple slack bridges, we need to keep track of the messages that are being sent
		if (!this.slackBotId && this.rocket.slackAdapters?.length >= 2) {
			this.storeMessageBeingSent(data);
		}

		const postResult = await this.slackAPI.sendMessage(data);

		if (!this.slackBotId && this.rocket.slackAdapters?.length >= 2) {
			this.removeMessageBeingSent(data);
		}

		if (!postResult?.ok || !postResult.message) {
			slackLogger.debug({ msg: 'Failed to send message to Slack', postResult });
			return;
		}

		if ('bot_id' in postResult.message && postResult.message.bot_id && postResult.message.ts) {
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

	/*
	 https://api.slack.com/methods/chat.update
	 */
	async postMessageUpdate(slackChannel: SlackChannel | undefined, rocketMessage: IMessage): Promise<void> {
		if (!slackChannel?.id) {
			return;
		}

		const data: ChatUpdateArguments = {
			ts: this.getTimeStamp(rocketMessage) as SlackTS,
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

	async processMemberJoinChannel(event: MemberJoinedChannelEvent, context: Record<string, any>) {
		slackLogger.debug({ msg: 'Member join channel', channel: event.channel });
		const rocketCh = await this.rocket.getChannel({ channel: event.channel });
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, event.channel);
			if (context?.botUserId !== event?.user) {
				const rocketChatUser = await this.rocket.getUser(event.user);
				rocketChatUser && (await addUserToRoom(rocketCh._id, rocketChatUser));
			}
		}
	}

	async processChannelJoin(slackMessage: ChannelJoinMessageEvent) {
		slackLogger.debug({ msg: 'Channel join', channelId: slackMessage.channel.id });
		const rocketCh = await this.rocket.addChannel(slackMessage.channel);
		if (rocketCh != null) {
			this.addSlackChannel(rocketCh._id, slackMessage.channel);
		}
	}

	async processFileShare(slackMessage: GenericMessageEvent | FileShareMessageEvent) {
		if (!settings.get('SlackBridge_FileUpload_Enabled')) {
			return;
		}
		const file = slackMessage.files?.[0];
		if (file?.url_private_download === undefined) {
			return;
		}

		const rocketChannel = await this.rocket.getChannel(slackMessage);
		if (!rocketChannel) {
			slackLogger.debug('Unable to processFileShare: RC channel not found.');
			return;
		}

		const rocketUser = await this.rocket.getUser(slackMessage.user);
		if (!rocketUser) {
			slackLogger.debug('Unable to processFileShare: RC user not found.');
			return;
		}

		// Hack to notify that a file was attempted to be uploaded
		delete slackMessage.subtype;

		// If the text includes the file link, simply use the same text for the rocket message.
		// If the link was not included, then use it instead of the message.

		if (!slackMessage.text?.includes(file.permalink)) {
			slackMessage.text = file.permalink;
		}

		const ts = new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000);
		const msgDataDefaults = {
			_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
			ts,
			updatedBySlack: true,
		};

		await this.rocket.createAndSaveMessage(
			rocketChannel,
			rocketUser,
			slackMessage,
			msgDataDefaults,
			false,
			this as unknown as ISlackAdapter,
		);
	}

	/*
	 https://api.slack.com/events/message/message_deleted
	 */
	async processMessageDeleted(slackMessage: MessageDeletedEvent) {
		if (slackMessage.previous_message) {
			const rocketChannel = await this.rocket.getChannel(slackMessage);
			const rocketUser = await Users.findOneById('rocket.cat', { projection: { username: 1 } });

			if (rocketChannel && rocketUser) {
				const botId = 'bot_id' in slackMessage.previous_message && slackMessage.previous_message.bot_id;
				// Find the Rocket message to delete
				let rocketMsgObj = botId && (await Messages.findOneBySlackBotIdAndSlackTs(botId, slackMessage.previous_message.ts));

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
	async processMessageChanged(slackMessage: MessageChangedEvent) {
		if (!slackMessage.previous_message) {
			return;
		}

		const currentMsg = await Messages.findOneById(this.rocket.createRocketID(slackMessage.channel, slackMessage.message.ts));
		if (!currentMsg) {
			return;
		}

		// Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)
		const messageText = ('text' in slackMessage.message && slackMessage.message.text) || '';
		if (messageText === currentMsg.msg) {
			return;
		}

		const rocketChannel = await this.rocket.getChannel(slackMessage);
		if (!rocketChannel) {
			slackLogger.debug('Unable to processMessageChanged: RC channel not found.');
			return;
		}

		const previousUser = 'user' in slackMessage.previous_message && slackMessage.previous_message.user;
		if (!previousUser) {
			slackLogger.debug('Unable to processMessageChanged: previous user not found.');
			return;
		}

		const rocketUser = await this.rocket.getUser(previousUser);

		if (!rocketUser) {
			slackLogger.debug('Unable to processMessageChanged: RC user not found.');
			return;
		}

		const rocketMsgObj = {
			// @TODO _id
			_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
			rid: rocketChannel._id,
			msg: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(messageText),
			updatedBySlack: true, // We don't want to notify slack about this change since Slack initiated it
		};

		await updateMessage(rocketMsgObj, rocketUser);
		slackLogger.debug('Rocket message updated by Slack');
	}

	async getUserForMessage(
		slackMessage: Exclude<SlackMessageEvent, MessageChangedEvent & MessageDeletedEvent & ChannelJoinMessageEvent>,
	): Promise<IRegisterUser | null> {
		if (slackMessage.subtype === 'bot_message') {
			return Users.findOneById<IRegisterUser>('rocket.cat');
		}

		const slackUser = 'user' in slackMessage && slackMessage.user;
		if (!slackUser) {
			return null;
		}

		return this.rocket.findUser(slackUser);
	}

	/*
	 This method will get refactored and broken down into single responsibilities
	 */
	async processNewMessage(
		slackMessage: Exclude<SlackMessageEvent, MessageChangedEvent & MessageDeletedEvent & ChannelJoinMessageEvent>,
		isImporting?: boolean,
	) {
		const rocketChannel = 'channel' in slackMessage && (await this.rocket.getChannel(slackMessage));
		const rocketUser = await this.getUserForMessage(slackMessage);

		if (rocketChannel && rocketUser) {
			const msgDataDefaults: Partial<IMessage> = {
				_id: this.rocket.createRocketID(slackMessage.channel, slackMessage.ts),
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
			};
			if (isImporting) {
				msgDataDefaults.imported = 'slackbridge';
			}
			try {
				await this.rocket.createAndSaveMessage(
					rocketChannel,
					rocketUser,
					slackMessage,
					msgDataDefaults,
					Boolean(isImporting),
					this as unknown as ISlackAdapter,
				);
			} catch (e: any) {
				// http://www.mongodb.org/about/contributors/error-codes/
				// 11000 == duplicate key error
				if (e.name === 'MongoError' && e.code === 11000) {
					return;
				}

				throw e;
			}
		}
	}

	async processBotMessage(rocketChannel: IRoom, slackMessage: BotMessageEvent): Promise<RocketChatMessageData | undefined> {
		const { excludeBotNames } = this.slackBridge;
		if (slackMessage.username !== undefined && excludeBotNames && slackMessage.username.match(excludeBotNames)) {
			return;
		}

		if (this.slackBotId) {
			if (slackMessage.bot_id === this.slackBotId) {
				return;
			}
		} else {
			const slackChannel = this.getSlackChannel(rocketChannel._id);
			if (slackChannel && this.isMessageBeingSent(slackMessage.username || slackMessage.bot_id, slackChannel.id)) {
				return;
			}
		}

		const rocketMsgObj: Partial<IMessage> = {
			msg: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
			rid: rocketChannel._id,
			bot: true,
			attachments: slackMessage.attachments,
			username: slackMessage.username || slackMessage.bot_id,
		} as any;
		this.rocket.addAliasToMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);
		if (slackMessage.icons) {
			rocketMsgObj.emoji = slackMessage.icons.emoji;
		}
		return rocketMsgObj;
	}

	async processMeMessage(rocketUser: IRegisterUser, slackMessage: MeMessageEvent): Promise<RocketChatMessageData | undefined> {
		return this.rocket.addAliasToMsg(rocketUser.username, {
			msg: `_${await this.rocket.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`,
		});
	}

	async processChannelJoinMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelJoinMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (isImporting) {
			await Message.saveSystemMessage('uj', rocketChannel._id, rocketUser.username, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await addUserToRoom(rocketChannel._id, rocketUser);
		}
	}

	async processGroupJoinMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelJoinMessageEvent | GroupJoinMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (!slackMessage.inviter) {
			return;
		}

		const inviter = await this.rocket.getUser(slackMessage.inviter);
		if (!inviter) {
			return;
		}

		if (isImporting) {
			await Message.saveSystemMessage('au', rocketChannel._id, rocketUser.username, inviter, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await addUserToRoom(rocketChannel._id, rocketUser, inviter);
		}
	}

	async processLeaveMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelLeaveMessageEvent | GroupLeaveMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (isImporting) {
			await Message.saveSystemMessage('ul', rocketChannel._id, rocketUser.username, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await removeUserFromRoom(rocketChannel._id, rocketUser);
		}
	}

	async processTopicMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelTopicMessageEvent | GroupTopicMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
		}
	}

	async processPurposeMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelPurposeMessageEvent | GroupPurposeMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (isImporting) {
			await Message.saveSystemMessage('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
		}
	}

	async processNameMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: ChannelNameMessageEvent | GroupNameMessageEvent,
		isImporting: boolean,
	): Promise<void> {
		if (isImporting) {
			await Message.saveSystemMessage('r', rocketChannel._id, slackMessage.name, rocketUser, {
				ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
				imported: 'slackbridge',
			});
		} else {
			await saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
		}
	}

	async processShareMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: FileShareMessageEvent,
		isImporting: boolean,
	): Promise<RocketChatMessageData | void> {
		// #TODO: file supposedly doesn't exist in this type, but this is what our legacy code expected
		const { file } = slackMessage as any;
		if (!file?.url_private_download) {
			return;
		}

		const details = {
			message_id: this.createSlackMessageId(slackMessage.ts),
			name: file.name,
			size: file.size,
			type: file.mimetype,
			rid: rocketChannel._id,
		};

		return this.uploadFileFromSlack(
			details,
			file.url_private_download,
			rocketUser,
			rocketChannel,
			new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
			isImporting,
		);
	}

	async processPinnedItemMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: PinnedItemMessageEvent,
		isImporting: boolean,
	): Promise<RocketChatMessageData | void> {
		const attachment = slackMessage.attachments?.[0];

		if (!attachment?.text) {
			slackLogger.error('Pinned item with no attachment');
			return;
		}

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
					text: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(attachment.text),
					author_name: attachment.author_subname,
					author_icon: getUserAvatarURL(attachment.author_subname as string),
					...(attachment.ts && {
						ts: new Date(parseInt(attachment.ts.split('.')[0]) * 1000),
					}),
				},
			],
		};

		if (!isImporting) {
			// #TODO: channel_id supposedly doesn't exist on this type, but it is what our legacy code expects
			const channelId = 'channel_id' in attachment ? (attachment.channel_id as string) : '';

			if (channelId && attachment.ts) {
				const messageId = this.createSlackMessageId(attachment.ts, channelId);
				await Messages.setPinnedByIdAndUserId(messageId, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
				if (settings.get('Message_Read_Receipt_Store_Users')) {
					await ReadReceipts.setPinnedByMessageId(messageId, true);
				}
			}
		}

		return rocketMsgObj;
	}

	async processSubtypedMessage(
		rocketChannel: IRoom,
		rocketUser: IRegisterUser,
		slackMessage: SlackMessageEvent,
		isImporting: boolean,
	): Promise<RocketChatMessageData | void> {
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
					await archiveRoom(rocketChannel._id, rocketUser);
				}
				return;
			case 'channel_unarchive':
			case 'group_unarchive':
				if (!isImporting) {
					await unarchiveRoom(rocketChannel._id, rocketUser);
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
	async uploadFileFromSlack(
		details: Partial<IUpload>,
		slackFileURL: string,
		rocketUser: IRegisterUser,
		rocketChannel: IRoom,
		timeStamp: Date,
		isImporting: boolean,
	) {
		const fileBuffer = await this.slackAPI.getFile(slackFileURL);
		if (!fileBuffer) {
			slackLogger.debug('Unable to uploadFileFromSlack: file contents not downloaded.');
			return;
		}

		const fileStore = FileUpload.getStore('Uploads');

		const file = await fileStore.insert(details, fileBuffer);

		const { url: fileUrl, type = '' } = file;

		if (!fileUrl) {
			slackLogger.debug('Unable to uploadFileFromSlack: file url is empty');
			return;
		}

		const url = fileUrl.replace(Meteor.absoluteUrl(), '/');
		const attachment: FileAttachmentProps = {
			type: 'file',
			title: file.name,
			title_link: url,
			...(/^image\/.+/.test(type) && {
				image_url: url,
				image_type: type,
				image_size: file.size,
				image_dimensions: file.identify?.size,
			}),
			...(/^audio\/.+/.test(type) && {
				audio_url: url,
				audio_type: type,
				audio_size: file.size,
			}),
			...(/^video\/.+/.test(type) && {
				video_url: url,
				video_type: type,
				video_size: file.size,
			}),
		};

		const msg: Partial<IMessage> = {
			rid: details.rid,
			ts: timeStamp,
			msg: '',
			file: {
				_id: file._id,
			} as FileProp,
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
	}

	async importFromHistory(options: ConversationsHistoryArguments): Promise<{ has_more: boolean | undefined; ts: string } | undefined> {
		slackLogger.debug('Importing messages history');
		const data = await this.slackAPI.getHistory(options);
		if (Array.isArray(data.messages) && data.messages.length) {
			let latest = '';
			for await (const message of data.messages.reverse()) {
				slackLogger.debug({ msg: 'MESSAGE', message });
				if (!latest || (message.ts && message.ts > latest)) {
					latest = message.ts || '';
				}

				const messageData = message as Exclude<SlackMessageEvent, FileCommentMessageEvent | FileMentionMessageEvent>;
				messageData.channel = options.channel;
				await this.onMessage(messageData, true);
			}
			return { has_more: data.has_more, ts: latest };
		}
	}

	async copyChannelInfo(rid: string, channelMap: SlackChannel): Promise<void> {
		slackLogger.debug({ msg: 'Copying users from Slack channel to Rocket.Chat', channelId: channelMap.id, rid });
		const channel = await this.slackAPI.getRoomInfo(channelMap.id);
		if (channel) {
			const members = await this.slackAPI.getMembers(channelMap.id);
			if (members && Array.isArray(members) && members.length) {
				for await (const member of members) {
					const user = (await this.rocket.findUser(member)) || (await this.rocket.addUser(member));
					if (user) {
						slackLogger.debug({ msg: 'Adding user to room', username: user.username, rid });
						await addUserToRoom(rid, user, undefined, { skipSystemMessage: true });
					}
				}
			}

			let topic = '';
			let topicLastSet = 0;
			let topicCreator = null;
			if (channel?.topic?.value) {
				topic = channel.topic.value;
				topicLastSet = channel.topic.last_set || topicLastSet;
				topicCreator = channel.topic.creator;
			}

			if (channel?.purpose?.value) {
				if (topicLastSet) {
					if (topicLastSet < (channel.purpose.last_set || 0)) {
						topic = (channel.purpose as any).topic || channel.purpose.value;
						topicCreator = channel.purpose.creator;
					}
				} else {
					topic = (channel.purpose as any).topic || channel.purpose.value;
					topicCreator = channel.purpose.creator;
				}
			}

			if (topic) {
				const creator = topicCreator && (await this.rocket.getUser(topicCreator));
				if (creator) {
					slackLogger.debug({ msg: 'Setting room topic', rid, topic, username: creator.username });
					await saveRoomTopic(rid, topic, creator, false);
				} else {
					slackLogger.debug('Unable to set room topic: topic creator not found.');
				}
			}
		}
	}

	async copyPins(rid: string, channelMap: SlackChannel): Promise<void> {
		const items = await this.slackAPI.getPins(channelMap.id);
		if (items && Array.isArray(items) && items.length) {
			for await (const pin of items) {
				// message and channel supposedly doesn't exist on this type #TODO
				const { message, channel } = pin as any;

				if (!message) {
					continue;
				}

				const user = await this.rocket.findUser(message.user);
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
							text: await this.rocket.convertSlackMsgTxtToRocketTxtFormat(message.text),
							author_name: user.username,
							author_icon: getUserAvatarURL(user.username),
							ts: new Date(parseInt(message.ts.split('.')[0]) * 1000),
						},
					],
				};

				const messageId = this.createSlackMessageId(message.ts, channel);
				await Messages.setPinnedByIdAndUserId(messageId, msgObj.u, true, new Date(parseInt(message.ts.split('.')[0]) * 1000));
				if (settings.get('Message_Read_Receipt_Store_Users')) {
					await ReadReceipts.setPinnedByMessageId(messageId, true);
				}
			}
		}
	}

	async importMessages(rid: string, callback: (error?: Meteor.Error) => void): Promise<void> {
		slackLogger.info({ msg: 'importMessages', rid });
		const rcRoom = await Rooms.findOneById(rid);
		if (rcRoom) {
			const slackChannel = this.getSlackChannel(rid);

			if (slackChannel) {
				await this.copyChannelInfo(rid, slackChannel);

				slackLogger.debug({ msg: 'Importing messages from Slack to Rocket.Chat', slackChannel: this.getSlackChannel(rid), rid });

				let results = await this.importFromHistory({
					channel: slackChannel.id,
					oldest: '1',
				});
				while (results?.has_more) {
					// eslint-disable-next-line no-await-in-loop
					results = await this.importFromHistory({
						channel: slackChannel.id,
						oldest: results.ts,
					});
				}

				slackLogger.debug({ msg: 'Pinning Slack channel messages to Rocket.Chat', slackChannel: this.getSlackChannel(rid), rid });
				await this.copyPins(rid, slackChannel);

				return callback();
			}
			const slackRoom = await this.postFindChannel(rcRoom.name as string);
			if (slackRoom?.id) {
				this.addSlackChannel(rid, slackRoom.id);
				return this.importMessages(rid, callback);
			}
			slackLogger.error({ msg: 'Could not find Slack room with specified name', roomName: rcRoom.name });
			return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
		}
		slackLogger.error({ msg: 'Could not find Rocket.Chat room with specified id', rid });
		return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
	}
}
