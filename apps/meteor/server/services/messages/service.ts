import type { IMessageService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IMessage, MessageTypesValues, IUser, IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import Filter from 'bad-words';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
import { executeSendMessage } from '../../../app/lib/server/methods/sendMessage';
import { executeSetReaction } from '../../../app/reactions/server/setReaction';
import { settings } from '../../../app/settings/server';

class BadWordsFilter {
	private static instance: Filter;

	private constructor() {
		// no op
	}

	static configure(badWordsList?: string, goodWordsList?: string) {
		const options = {
			list:
				badWordsList
					?.split(',')
					.map((word) => word.trim())
					.filter(Boolean) || [],
			// library definition does not allow optional definition
			exclude: undefined,
			splitRegex: undefined,
			placeHolder: undefined,
			regex: undefined,
			replaceRegex: undefined,
			emptyList: undefined,
		};

		BadWordsFilter.instance = new Filter(options);

		if (goodWordsList?.length) {
			BadWordsFilter.instance.removeWords(...goodWordsList.split(',').map((word) => word.trim()));
		}
	}

	static getFilter() {
		if (!BadWordsFilter.instance) {
			throw new Error('BadWordsFilter not configured');
		}
		return BadWordsFilter.instance;
	}
}

export class MessageService extends ServiceClassInternal implements IMessageService {
	protected name = 'message';

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
		// TODO move BadWordsFilter.configure to constructor and watch for settings changes
		const badWordsList = settings.get<string>('Message_BadWordsFilterList');
		const whiteList = settings.get<string>('Message_BadWordsWhitelist');
		BadWordsFilter.configure(badWordsList, whiteList);

		// TODO looks like this one was not being used
		// await this.joinDiscussionOnMessage({ message, room, user });

		message = await this.filterBadWords(message);

		return message;
	}

	private async filterBadWords(message: IMessage): Promise<IMessage> {
		if (!message.msg) {
			return message;
		}

		if (!settings.get('Message_AllowBadWordsFilter')) {
			return message;
		}

		try {
			const filter = BadWordsFilter.getFilter();

			message.msg = filter.clean(message.msg);
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
