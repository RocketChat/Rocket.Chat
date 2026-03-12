import type { IMessage, MessageTypesValues, IUser, IRoom, AtLeast, MessageUrl } from '@rocket.chat/core-typings';

export interface IMessageService {
	/**
	 * Sends a message from a user to a room.
	 */
	sendMessage({ fromId, rid, msg }: { fromId: string; rid: string; msg: string }): Promise<IMessage>;

	/**
	 * Saves a system message to a room.
	 * @param type The type of system message (e.g., 'room_changed_name').
	 * @param rid The room ID.
	 * @param message The message text.
	 * @param user The user who triggered the system message.
	 * @param extraData Additional message data.
	 */
	saveSystemMessage<T = IMessage>(

		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage>;
	saveMessageFromFederation({
		fromId,
		rid,
		federation_event_id,
		msg,
		e2e_content,
		file,
		files,
		attachments,
		thread,
		ts,
	}: {
		fromId: string;
		rid: string;
		federation_event_id: string;
		msg?: string;
		e2e_content?: {
			algorithm: string;
			ciphertext: string;
		};
		file?: IMessage['file'];
		files?: IMessage['files'];
		attachments?: IMessage['attachments'];
		thread?: { tmid: string; tshow: boolean };
		ts: Date;
	}): Promise<IMessage>;
	saveSystemMessageAndNotifyUser<T = IMessage>(
		type: MessageTypesValues,
		rid: string,
		message: string,
		user: Pick<IUser, '_id' | 'username' | 'name'>,
		extraData?: Partial<T>,
	): Promise<IMessage>;
	beforeSave(param: { message: IMessage; room: IRoom; user: IUser; previewUrls?: string[]; parseUrls?: boolean }): Promise<IMessage>;
	sendMessageWithValidation(user: IUser, message: Partial<IMessage>, room: Partial<IRoom>, upsert?: boolean): Promise<IMessage>;
	deleteMessage(user: IUser, message: IMessage): Promise<void>;
	updateMessage(message: IMessage, user: IUser, originalMsg?: IMessage): Promise<void>;
	reactToMessage(userId: string, reaction: string, messageId: IMessage['_id'], shouldReact?: boolean): Promise<void>;
	beforeReacted(message: IMessage, room: AtLeast<IRoom, 'federated'>): Promise<void>;
	beforeDelete(message: IMessage, room: IRoom): Promise<void>;
	afterSave(param: { message: IMessage }): Promise<void>;
	parseOEmbedUrl(url: string): Promise<{
		urlPreview: MessageUrl;
		foundMeta: boolean;
	}>;
}
