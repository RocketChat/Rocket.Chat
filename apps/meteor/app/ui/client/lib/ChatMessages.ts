import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { isVideoConfMessage } from '@rocket.chat/core-typings';
import type { UIEvent } from 'react';

import type { ChatAPI, ComposerAPI, DataAPI, UploadsAPI } from '../../../../client/lib/chats/ChatAPI';
import { createDataAPI } from '../../../../client/lib/chats/data';
import { processMessageEditing } from '../../../../client/lib/chats/flows/processMessageEditing';
import { processSetReaction } from '../../../../client/lib/chats/flows/processSetReaction';
import { processSlashCommand } from '../../../../client/lib/chats/flows/processSlashCommand';
import { processTooLongMessage } from '../../../../client/lib/chats/flows/processTooLongMessage';
import { replyBroadcast } from '../../../../client/lib/chats/flows/replyBroadcast';
import { requestMessageDeletion } from '../../../../client/lib/chats/flows/requestMessageDeletion';
import { sendMessage } from '../../../../client/lib/chats/flows/sendMessage';
import { uploadFiles } from '../../../../client/lib/chats/flows/uploadFiles';
import { createUploadsAPI } from '../../../../client/lib/chats/uploads';
import {
	setHighlightMessage,
	clearHighlightMessage,
} from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';
import { UserAction } from './UserAction';

type DeepWritable<T> = T extends (...args: any) => any
	? T
	: {
			-readonly [P in keyof T]: DeepWritable<T[P]>;
	  };

export class ChatMessages implements ChatAPI {
	public uid: string | null;

	public composer: ComposerAPI | undefined;

	public setComposerAPI = (composer: ComposerAPI): void => {
		this.composer?.release();
		this.composer = composer;
	};

	public data: DataAPI;

	public uploads: UploadsAPI;

	public userCard: { open(username: string): (event: UIEvent) => void; close(): void };

	public emojiPicker: {
		open(el: Element, cb: (emoji: string) => void): void;
		close(): void;
	};

	public action: {
		start(action: 'typing'): Promise<void> | void;
		stop(action: 'typing' | 'recording' | 'uploading' | 'playing'): Promise<void> | void;
		performContinuously(action: 'recording' | 'uploading' | 'playing'): Promise<void> | void;
	};

	private currentEditingMID?: string;

	public messageEditing: ChatAPI['messageEditing'] = {
		toPreviousMessage: async () => {
			if (!this.composer) {
				return;
			}

			if (!this.currentEditing) {
				let lastMessage = await this.data.findLastOwnMessage();

				// Videoconf messages should not be edited
				if (lastMessage && isVideoConfMessage(lastMessage)) {
					lastMessage = await this.data.findPreviousOwnMessage(lastMessage);
				}

				if (lastMessage) {
					await this.data.saveDraft(undefined, this.composer.text);
					await this.messageEditing.editMessage(lastMessage);
				}

				return;
			}

			const currentMessage = await this.data.findMessageByID(this.currentEditing.mid);
			let previousMessage = currentMessage ? await this.data.findPreviousOwnMessage(currentMessage) : undefined;

			// Videoconf messages should not be edited
			if (previousMessage && isVideoConfMessage(previousMessage)) {
				previousMessage = await this.data.findPreviousOwnMessage(previousMessage);
			}

			if (previousMessage) {
				await this.messageEditing.editMessage(previousMessage);
				return;
			}

			await this.currentEditing.cancel();
		},
		toNextMessage: async () => {
			if (!this.composer || !this.currentEditing) {
				return;
			}

			const currentMessage = await this.data.findMessageByID(this.currentEditing.mid);
			let nextMessage = currentMessage ? await this.data.findNextOwnMessage(currentMessage) : undefined;

			// Videoconf messages should not be edited
			if (nextMessage && isVideoConfMessage(nextMessage)) {
				nextMessage = await this.data.findNextOwnMessage(nextMessage);
			}

			if (nextMessage) {
				await this.messageEditing.editMessage(nextMessage, { cursorAtStart: true });
				return;
			}

			await this.currentEditing.cancel();
		},
		editMessage: async (message: IMessage, { cursorAtStart = false }: { cursorAtStart?: boolean } = {}) => {
			const text = (await this.data.getDraft(message._id)) || message.attachments?.[0]?.description || message.msg;

			await this.currentEditing?.stop();

			if (!this.composer || !(await this.data.canUpdateMessage(message))) {
				return;
			}

			this.currentEditingMID = message._id;
			setHighlightMessage(message._id);
			this.composer.setEditingMode(true);

			this.composer.setText(text);
			cursorAtStart && this.composer.setCursorToStart();
			!cursorAtStart && this.composer.setCursorToEnd();
			this.composer.focus();
		},
	};

	public flows: DeepWritable<ChatAPI['flows']>;

	public constructor(
		private params: {
			rid: IRoom['_id'];
			tmid?: IMessage['_id'];
			uid: IUser['_id'] | null;
		},
	) {
		const { rid, tmid } = params;
		this.uid = params.uid;
		this.data = createDataAPI({ rid, tmid });
		this.uploads = createUploadsAPI({ rid, tmid });

		const unimplemented = () => {
			throw new Error('Flow is not implemented');
		};

		this.userCard = {
			open: unimplemented,
			close: unimplemented,
		};

		this.emojiPicker = {
			open: unimplemented,
			close: unimplemented,
		};

		this.action = {
			start: async (action: 'typing') => {
				UserAction.start(params.rid, `user-${action}`, { tmid: params.tmid });
			},
			performContinuously: async (action: 'recording' | 'uploading' | 'playing') => {
				UserAction.performContinuously(params.rid, `user-${action}`, { tmid: params.tmid });
			},
			stop: async (action: 'typing' | 'recording' | 'uploading' | 'playing') => {
				UserAction.stop(params.rid, `user-${action}`, { tmid: params.tmid });
			},
		};

		this.flows = {
			uploadFiles: uploadFiles.bind(null, this),
			sendMessage: sendMessage.bind(this, this),
			processSlashCommand: processSlashCommand.bind(null, this),
			processTooLongMessage: processTooLongMessage.bind(null, this),
			processMessageEditing: processMessageEditing.bind(null, this),
			processSetReaction: processSetReaction.bind(null, this),
			requestMessageDeletion: requestMessageDeletion.bind(this, this),
			replyBroadcast: replyBroadcast.bind(null, this),
		};
	}

	public get currentEditing() {
		if (!this.composer || !this.currentEditingMID) {
			return undefined;
		}

		return {
			mid: this.currentEditingMID,
			reset: async (): Promise<boolean> => {
				if (!this.composer || !this.currentEditingMID) {
					return false;
				}

				const message = await this.data.findMessageByID(this.currentEditingMID);
				if (this.composer.text !== message?.msg) {
					this.composer.setText(message?.msg ?? '');
					return true;
				}

				return false;
			},
			stop: async (): Promise<void> => {
				if (!this.composer || !this.currentEditingMID) {
					return;
				}

				const message = await this.data.findMessageByID(this.currentEditingMID);
				const draft = this.composer.text;

				if (draft === message?.msg) {
					await this.data.discardDraft(this.currentEditingMID);
				} else {
					await this.data.saveDraft(this.currentEditingMID, (await this.data.getDraft(this.currentEditingMID)) || draft);
				}

				this.composer.setEditingMode(false);
				this.currentEditingMID = undefined;
				clearHighlightMessage();
			},
			cancel: async (): Promise<void> => {
				if (!this.currentEditingMID) {
					return;
				}

				await this.data.discardDraft(this.currentEditingMID);
				await this.currentEditing?.stop();
				this.composer?.setText((await this.data.getDraft(undefined)) ?? '');
			},
		};
	}

	public async release() {
		if (this.currentEditing) {
			if (!this.params.tmid) {
				await this.currentEditing.cancel();
			}
			this.composer?.clear();
		}
	}
}
