import type { AtLeast, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';

import { closeUnclosedCodeBlock } from '../../../../lib/utils/closeUnclosedCodeBlock';
import type { ChatAPI } from '../ChatAPI';

export type SendMessageChat = Pick<ChatAPI, 'composer' | 'data' | 'readStateManager' | 'currentEditingMessage'> & {
	readonly flows: Pick<ChatAPI['flows'], 'processMessageEditing' | 'requestMessageDeletion'>;
};

export type SendMessageParams = {
	text: string;
	tshow?: boolean;
	previewUrls?: string[];
	isSlashCommandAllowed?: boolean;
	tmid?: IMessage['tmid'];
};

export type StoredMessage = IMessage & { temp?: boolean };

type ChatMessageToSend = AtLeast<IMessage, '_id' | 'rid' | 'msg'> & { isEditing?: boolean };

export type SendMessageDeps<TChat extends SendMessageChat = SendMessageChat> = {
	getUserId(): string | undefined;
	getUser(): Pick<IUser, 'username' | 'name'> | undefined | null;
	trim(text: string | undefined): string;
	getMessage(id: IMessage['_id']): StoredMessage | undefined;
	storeMessage(message: IMessage): void;
	updateMessage(predicate: (record: StoredMessage) => boolean, modifier: (record: StoredMessage) => StoredMessage): void;
	getRoom(rid: IRoom['_id']): Pick<IRoom, 'federated'> | undefined;
	isReadReceiptEnabled(): boolean | undefined;
	onClientMessageReceived(message: IMessage): Promise<IMessage>;
	onClientBeforeSendMessage(message: ChatMessageToSend): Promise<ChatMessageToSend>;
	upsertThreadMessage(message: IMessage, rid: IMessage['rid'], tmid: IMessage['_id']): void;
	postMessage(params: { message: IMessage; previewUrls: string[] | undefined }): Promise<unknown>;
	afterSendMessage(message: IMessage, rid: IMessage['rid']): Promise<unknown>;
	notifyError(error: unknown): void;
	notifyAlreadySent(): void;
	notifyMessageNotFound(): void;
	flows: {
		processSetReaction(chat: TChat, message: IMessage): Promise<boolean>;
		processTooLongMessage(chat: TChat, message: IMessage): Promise<boolean>;
		processSlashCommand(chat: TChat, message: IMessage): Promise<boolean>;
		processMessageUploads(chat: TChat, message: IMessage): Promise<boolean>;
		processMessageEditing(chat: TChat, message: IMessage, previewUrls?: string[]): Promise<boolean>;
	};
};

const runOptimisticSendMessage = async <TChat extends SendMessageChat>(
	deps: SendMessageDeps<TChat>,
	message: Partial<IMessage> & { rid: IMessage['rid']; msg: IMessage['msg'] },
): Promise<void> => {
	const uid = deps.getUserId();
	if (!uid || deps.trim(message.msg) === '') {
		return;
	}
	const messageAlreadyExists = message._id && deps.getMessage(message._id);
	if (messageAlreadyExists) {
		deps.notifyAlreadySent();
		return;
	}
	const user = deps.getUser();
	if (!user?.username) {
		return;
	}

	const room = deps.getRoom(message.rid);
	if (room?.federated) {
		return;
	}

	const optimistic: IMessage = {
		...(message as IMessage),
		ts: new Date(),
		u: {
			_id: uid,
			username: user.username,
			name: user.name || '',
		},
		temp: true,
		...(deps.isReadReceiptEnabled() ? { unread: true } : {}),
	};

	const processed = await deps.onClientMessageReceived(optimistic);
	deps.storeMessage(processed);

	if (processed.tmid) {
		deps.upsertThreadMessage(processed, processed.rid, processed.tmid);
	}
};

const process = async <TChat extends SendMessageChat>(
	deps: SendMessageDeps<TChat>,
	chat: TChat,
	message: IMessage,
	previewUrls?: string[],
	isSlashCommandAllowed?: boolean,
): Promise<void> => {
	const mid = chat.currentEditingMessage.getMID();

	if (await deps.flows.processSetReaction(chat, message)) {
		return;
	}

	if (await deps.flows.processTooLongMessage(chat, message)) {
		return;
	}

	if (isSlashCommandAllowed && (await deps.flows.processSlashCommand(chat, message))) {
		return;
	}

	if (await deps.flows.processMessageUploads(chat, message)) {
		chat.composer?.clear();
		return;
	}

	message = (await deps.onClientBeforeSendMessage({ ...message, isEditing: !!mid })) as IMessage & { isEditing?: boolean };

	// e2e should be a client property only
	delete message.e2e;
	delete (message as IMessage & { isEditing?: boolean }).isEditing;

	if (await deps.flows.processMessageEditing(chat, message, previewUrls)) {
		return;
	}

	chat.composer?.clear();
	await runOptimisticSendMessage(deps, message);

	await deps.postMessage({ message, previewUrls });

	// Clear the optimistic `temp` flag only if the messages stream hasn't already
	// replaced the record. Overwriting with the server response can clobber stream
	// updates that arrive first — e.g. read-receipt-driven `unread: false`, async
	// URL/quote attachments, or E2EE decrypt — leading to stale UI state.
	deps.updateMessage(
		(record) => record._id === message._id && record.temp === true,
		({ temp: _, ...record }) => record,
	);
};

export const sendMessageCore = async <TChat extends SendMessageChat>(
	deps: SendMessageDeps<TChat>,
	chat: TChat,
	{ text, tshow, previewUrls, isSlashCommandAllowed }: SendMessageParams,
): Promise<boolean> => {
	if (!(await chat.data.isSubscribedToRoom())) {
		try {
			await chat.data.joinRoom();
		} catch (error) {
			deps.notifyError(error);
			return false;
		}
	}

	chat.readStateManager.clearUnreadMark();

	const uploadsStore = chat.composer?.uploads;

	text = text.trim();
	text = closeUnclosedCodeBlock(text);
	const mid = chat.currentEditingMessage.getMID();

	const hasFiles = uploadsStore && uploadsStore.get().length > 0;
	if (!text && !mid && !hasFiles) {
		// Nothing to do
		return false;
	}

	if (text || hasFiles) {
		const message = await chat.data.composeMessage(text, {
			sendToChannel: tshow,
			quotedMessages: chat.composer?.quotedMessages.get() ?? [],
			originalMessage: mid ? await chat.data.findMessageByID(mid) : null,
		});

		// When editing an encrypted message with files, preserve the original attachments/files
		// This ensures they're included in the re-encryption process
		if (mid) {
			const originalMessage = await chat.data.findMessageByID(mid);

			if (originalMessage?.t === 'e2e' && originalMessage.attachments && originalMessage.attachments.length > 0) {
				message.attachments = originalMessage.attachments;
				message.file = originalMessage.file;
			}
		}

		try {
			// Dismiss quoted messages optimistically — they are already baked into
			// `message` by composeMessage above, so the composer preview must unmount
			// regardless of whether the send request resolves. Keeping it coupled to a
			// resolved request leaves the quote stuck in the composer when the REST call
			// rejects even though the message was already broadcast over the stream.
			chat.composer?.dismissAllQuotedMessages();
			await process(deps, chat, message, previewUrls, isSlashCommandAllowed);
			await deps.afterSendMessage(message, message.rid);
		} catch (error) {
			deps.notifyError(error);
		}
		return true;
	}

	if (mid) {
		const originalMessage = await chat.data.findMessageByID(mid);

		if (!originalMessage) {
			deps.notifyMessageNotFound();
			return false;
		}

		try {
			if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' }, previewUrls)) {
				chat.currentEditingMessage.stop();
				return false;
			}

			await chat.currentEditingMessage.reset();
			await chat.flows.requestMessageDeletion(originalMessage);
			return false;
		} catch (error) {
			deps.notifyError(error);
		}
	}

	return false;
};
