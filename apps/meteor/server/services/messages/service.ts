import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import { type IMessage, type MessageTypesValues, type IUser, type IRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { executeSetReaction } from '../../../app/reactions/server/setReaction';
import { settings } from '../../../app/settings/server';
import { broadcastMessageSentEvent } from '../../modules/watchers/lib/messages';
import { BeforeSaveBadWords } from './hooks/BeforeSaveBadWords';
import { BeforeSavePreventMention } from './hooks/BeforeSavePreventMention';
import { BeforeSaveSpotify } from './hooks/BeforeSaveSpotify';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	private preventMention: BeforeSavePreventMention;

	private badWords: BeforeSaveBadWords;

	private spotify: BeforeSaveSpotify;

	async created() {
		this.preventMention = new BeforeSavePreventMention(this.api);
		this.badWords = new BeforeSaveBadWords();
		this.spotify = new BeforeSaveSpotify();

		await this.configureBadWords();
	}

	private async configureBadWords() {
		settings.watchMultiple(
			['Message_AllowBadWordsFilter', 'Message_BadWordsFilterList', 'Message_BadWordsWhitelist'],
			async ([enabled, badWordsList, whiteList]) => {
				if (!enabled) {
					this.badWords.disable();
					return;
				}
				await this.badWords.configure(badWordsList as string, whiteList as string);
			},
		);
	}

	async sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage> {
		return executeSendMessage(fromId, { rid, msg });
	}

	async sendMessageWithValidation(user: IUser, message: Partial<IMessage>, room: Partial<IRoom>, upsert = false): Promise<IMessage> {
		return sendMessage(user, message, room, upsert);
	}

	async deleteMessage(user: IUser, message: IMessage): Promise<void> {
		return deleteMessage(message, user);
	}

	async updateMessage(message: IMessage, user: IUser, originalMsg?: IMessage, previewUrls?: string[]): Promise<void> {
		return updateMessage(message, user, originalMsg, previewUrls);
	}

	async reactToMessage(userId: string, reaction: string, messageId: IMessage['_id'], shouldReact?: boolean): Promise<void> {
		return executeSetReaction(userId, reaction, messageId, shouldReact);
	}

	async saveSystemMessage<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		owner: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage['_id']> {
		const { _id: userId, username, name } = owner;
		if (!username) {
			throw new Error('The username cannot be empty.');
		}
		const result = await Messages.createWithTypeRoomIdMessageUserAndUnread(
			type,
			rid,
			message,
			{ _id: userId, username, name },
			settings.get('Message_Read_Receipt_Enabled'),
			extraData,
		);
		void broadcastMessageSentEvent({
			id: result.insertedId,
			broadcastCallback: async (message) => this.api?.broadcast('message.sent', message),
		});
		return result.insertedId;
	}

	async beforeSave({
		message,
		room: _room,
		user,
	}: {
		message: IMessage;
		room: IRoom;
		user: Pick<IUser, '_id' | 'username' | 'name' | 'language'>;
	}): Promise<IMessage> {
		// TODO looks like this one was not being used (so I'll left it commented)
		// await this.joinDiscussionOnMessage({ message, room, user });

		message = await this.badWords.filterBadWords({ message });
		message = await this.spotify.convertSpotifyLinks({ message });

		if (!this.isEditedOrOld(message)) {
			await Promise.all([
				this.preventMention.preventMention({ message, user, mention: 'all', permission: 'mention-all' }),
				this.preventMention.preventMention({ message, user, mention: 'here', permission: 'mention-here' }),
			]);
		}

		return message;
	}

	private isEditedOrOld(message: IMessage): boolean {
		return isEditedMessage(message) || !message.ts || Math.abs(Date.now() - message.ts.getTime()) > 60000;
	}

	// joinDiscussionOnMessage
	// private async joinDiscussionOnMessage({ message, room, user }: { message: IMessage; room: IRoom; user: IUser }) {
	// 	// abort if room is not a discussion
	// 	if (!room.prid) {
	// 		return;
	// 	}

	// 	// check if user already joined the discussion
	// 	const sub = await Subscriptions.findOneByRoomIdAndUserId(room._id, message.u._id, {
	// 		projection: { _id: 1 },
	// 	});

	// 	if (sub) {
	// 		return;
	// 	}

	// 	await Room.join({ room, user });
	// }
}
