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
	private messageEditingState: {
		element?: HTMLElement;
		id?: string;
		savedValue?: string;
		savedCursorPosition?: number;
		drafts: Record<IMessage['_id'], string | undefined>;
	} = {
		drafts: {},
	};

	public messageEditing: ChatAPI['messageEditing'] = {
		toPreviousMessage: async () => {
			if (!this.composer) {
				return;
			}

			if (!this.currentEditing) {
				const lastMessage = await this.data.findLastOwnMessage();

				if (lastMessage) {
					this.messageEditing.editMessage(lastMessage);
				}

				return;
			}

			const currentMessage = await this.data.findMessageByID(this.currentEditing.mid);
			const previousMessage = currentMessage ? await this.data.findPreviousOwnMessage(currentMessage) : undefined;

			if (previousMessage) {
				this.messageEditing.editMessage(previousMessage);
				return;
			}

			await this.currentEditing.stop();
		},
		toNextMessage: async () => {
			if (!this.composer || !this.currentEditing) {
				return;
			}

			const currentMessage = await this.data.findMessageByID(this.currentEditing.mid);
			const nextMessage = currentMessage ? await this.data.findNextOwnMessage(currentMessage) : undefined;

			if (nextMessage) {
				this.messageEditing.editMessage(nextMessage, { cursorAtStart: true });
				return;
			}

			await this.currentEditing.stop();
		},
		getDraft: async (mid) => this.messageEditingState.drafts[mid],
		editMessage: async (message: IMessage, { cursorAtStart = false }: { cursorAtStart?: boolean } = {}) => {
			if (!this.composer) {
				this.currentEditing?.stop();
				return;
			}

			if (!(await this.data.canUpdateMessage(message))) {
				this.currentEditing?.stop();
				return;
			}

			const text = message.attachments?.[0].description || (await this.messageEditing.getDraft(message._id)) || message.msg;
			const cursorPosition = cursorAtStart ? 0 : text.length;

			this.currentEditing?.stop();

			const element = document.getElementById(this.params.tmid ? `thread-${message._id}` : message._id);

			this.messageEditingState.id = message._id;
			if (element) {
				this.messageEditingState.element = element;
				element.classList.add('editing');
			}
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
		if (!this.composer || !this.messageEditingState.id) {
			return undefined;
		}

		return {
			mid: this.messageEditingState.id,
			reset: async (): Promise<boolean> => {
				if (!this.composer || !this.messageEditingState.id) {
					return false;
				}

				const message = await this.data.findMessageByID(this.messageEditingState.id);
				if (this.composer.text !== message?.msg) {
					this.composer.setText(message?.msg ?? '');
					return true;
				}

				return false;
			},
			stop: async (): Promise<void> => {
				if (!this.composer || !this.messageEditingState.id) {
					return;
				}

				if (!this.messageEditingState.element) {
					this.messageEditingState.savedValue = this.composer?.text;
					this.messageEditingState.savedCursorPosition = this.composer?.selection.start;
					return;
				}

				const message = await this.data.findMessageByID(this.messageEditingState.id);
				const draft = this.composer.text;

				if (draft === message?.msg) {
					delete this.messageEditingState.drafts[this.messageEditingState.id];
				} else {
					this.messageEditingState.drafts[this.messageEditingState.id] ||= draft;
				}

				this.composer?.setEditingMode(false);
				this.messageEditingState.element.classList.remove('editing');
				delete this.messageEditingState.id;
				delete this.messageEditingState.element;
				clearHighlightMessage();

				const cursorPosition = this.messageEditingState.savedCursorPosition
					? this.messageEditingState.savedCursorPosition
					: this.composer.text.length;
				this.composer?.setText(this.messageEditingState.savedValue || '', { selection: { start: cursorPosition, end: cursorPosition } });
			},
			cancel: async (): Promise<void> => {
				if (!this.messageEditingState.id) {
					return;
				}

				delete this.messageEditingState.drafts[this.messageEditingState.id];
				this.currentEditing?.stop();
			},
		};
	}

	private release() {
		this.composer?.release();
		if (this.currentEditing) {
			if (!this.params.tmid) {
				this.currentEditing.cancel();
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
