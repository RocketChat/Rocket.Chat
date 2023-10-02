import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IMessage, MessageTypesValues, IUser, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import type BadWordsFilter from 'bad-words';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { executeSetReaction } from '../../../app/reactions/server/setReaction';
import { settings } from '../../../app/settings/server';
import { configureBadWords } from './hooks/badwords';

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

	private badWordsFilter?: BadWordsFilter;

	async created() {
		await this.configureBadWords();
	}

	private async configureBadWords() {
		settings.watchMultiple(
			['Message_AllowBadWordsFilter', 'Message_BadWordsFilterList', 'Message_BadWordsWhitelist'],
			async ([enabled, badWordsList, whiteList]) => {
				if (!enabled) {
					this.badWordsFilter = undefined;
					return;
				}
				this.badWordsFilter = await configureBadWords(badWordsList as string, whiteList as string);
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

		return result.insertedId;
	}

	async beforeSave({
		message,
		room: _room,
		user: _user,
	}: {
		message: IMessage;
		room: IRoom;
		user: Pick<IUser, '_id' | 'username' | 'name'>;
	}): Promise<IMessage> {
		// TODO looks like this one was not being used (so I'll left it commented)
		// await this.joinDiscussionOnMessage({ message, room, user });

		// conditionals here should be fast, so they won't add up for each message
		if (this.isBadWordsFilterEnabled()) {
			message = await this.filterBadWords(message);
		}

		return message;
	}

	private isBadWordsFilterEnabled() {
		return !!settings.get('Message_AllowBadWordsFilter');
	}

	private async filterBadWords(message: IMessage): Promise<IMessage> {
		if (!message.msg || !this.badWordsFilter) {
			return message;
		}

		try {
			message.msg = this.badWordsFilter.clean(message.msg);
		} catch (error) {
			// ignore
		}

		return message;
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
