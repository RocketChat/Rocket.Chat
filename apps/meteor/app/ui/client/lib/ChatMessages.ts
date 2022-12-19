import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { createUploadsAPI } from '../../../../client/lib/chats/uploads';
import {
	setHighlightMessage,
	clearHighlightMessage,
} from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';
import type { ChatAPI, ComposerAPI, DataAPI, UploadsAPI } from '../../../../client/lib/chats/ChatAPI';
import { createDataAPI } from '../../../../client/lib/chats/data';
import { uploadFiles } from '../../../../client/lib/chats/flows/uploadFiles';
import { processSlashCommand } from '../../../../client/lib/chats/flows/processSlashCommand';
import { requestMessageDeletion } from '../../../../client/lib/chats/flows/requestMessageDeletion';
import { processMessageEditing } from '../../../../client/lib/chats/flows/processMessageEditing';
import { processTooLongMessage } from '../../../../client/lib/chats/flows/processTooLongMessage';
import { processSetReaction } from '../../../../client/lib/chats/flows/processSetReaction';
import { sendMessage } from '../../../../client/lib/chats/flows/sendMessage';

export class ChatMessages implements ChatAPI {
	private currentEditingMID?: string;

	public messageEditing: ChatAPI['messageEditing'] = {
		toPreviousMessage: async () => {
			if (!this.composer) {
				return;
			}

			if (!this.currentEditing) {
				const lastMessage = await this.data.findLastOwnMessage();

				if (lastMessage) {
					await this.data.saveDraft(undefined, this.composer.text);
					await this.messageEditing.editMessage(lastMessage);
				}

				return;
			}

			const currentMessage = await this.data.findMessageByID(this.currentEditing.mid);
			const previousMessage = currentMessage ? await this.data.findPreviousOwnMessage(currentMessage) : undefined;

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
			const nextMessage = currentMessage ? await this.data.findNextOwnMessage(currentMessage) : undefined;

			if (nextMessage) {
				await this.messageEditing.editMessage(nextMessage, { cursorAtStart: true });
				return;
			}

			await this.currentEditing.cancel();
		},
		editMessage: async (message: IMessage, { cursorAtStart = false }: { cursorAtStart?: boolean } = {}) => {
			const text = (await this.data.getDraft(message._id)) || message.attachments?.[0].description || message.msg;
			const cursorPosition = cursorAtStart ? 0 : text.length;

			await this.currentEditing?.stop();

			if (!this.composer || !(await this.data.canUpdateMessage(message))) {
				return;
			}

			this.currentEditingMID = message._id;
			setHighlightMessage(message._id);
			this.composer?.setEditingMode(true);

			this.composer.setText(text, { selection: { start: cursorPosition, end: cursorPosition } });
			this.composer?.focus();
		},
	};

	public composer: ComposerAPI | undefined;

	public readonly data: DataAPI;

	public readonly uploads: UploadsAPI;

	public readonly flows: ChatAPI['flows'];

	public constructor(private params: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		this.data = createDataAPI({ rid: params.rid, tmid: params.tmid });
		this.uploads = createUploadsAPI({ rid: params.rid, tmid: params.tmid });
		this.flows = {
			uploadFiles: uploadFiles.bind(null, this),
			sendMessage: sendMessage.bind(this, this),
			processSlashCommand: processSlashCommand.bind(null, this),
			processTooLongMessage: processTooLongMessage.bind(null, this),
			processMessageEditing: processMessageEditing.bind(null, this),
			processSetReaction: processSetReaction.bind(null, this),
			requestMessageDeletion: requestMessageDeletion.bind(this, this),
		};
	}

	public setComposerAPI(composer: ComposerAPI): void {
		this.composer?.release();
		this.composer = composer;
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

	private async release() {
		this.composer?.release();
		if (this.currentEditing) {
			if (!this.params.tmid) {
				await this.currentEditing.cancel();
			}
			this.composer?.clear();
		}
	}

	private static refs = new Map<string, { instance: ChatMessages; count: number }>();

	private static getID({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): string {
		return `${rid}${tmid ? `-${tmid}` : ''}`;
	}

	public static hold({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		const id = this.getID({ rid, tmid });

		const ref = this.refs.get(id) ?? { instance: new ChatMessages({ rid, tmid }), count: 0 };
		ref.count++;
		this.refs.set(id, ref);

		return ref.instance;
	}

	public static release({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		const id = this.getID({ rid, tmid });

		const ref = this.refs.get(id);
		if (!ref) {
			return;
		}

		ref.count--;
		if (ref.count === 0) {
			this.refs.delete(id);
			ref.instance.release();
		}
	}
}
