import { Meteor } from 'meteor/meteor';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { KonchatNotification } from './notification';
import { createUploadsAPI } from '../../../../client/lib/chats/uploads';
import { t } from '../../../utils/client';
import { messageProperties } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { emoji } from '../../../emoji/client';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import GenericModal from '../../../../client/components/GenericModal';
import { prependReplies } from '../../../../client/lib/utils/prependReplies';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { onClientBeforeSendMessage } from '../../../../client/lib/onClientBeforeSendMessage';
import {
	setHighlightMessage,
	clearHighlightMessage,
} from '../../../../client/views/room/MessageList/providers/messageHighlightSubscription';
import type { ChatAPI, ComposerAPI, DataAPI, UploadsAPI } from '../../../../client/lib/chats/ChatAPI';
import { createDataAPI } from '../../../../client/lib/chats/data';
import { uploadFiles } from '../../../../client/lib/chats/flows/uploadFiles';
import { getRandomId } from '../../../../lib/random';
import { processSlashCommand } from '../../../../client/lib/chats/flows/processSlashCommand';
import { requestMessageDeletion } from '../../../../client/lib/chats/flows/requestMessageDeletion';
import { processMessageEditing } from '../../../../client/lib/chats/flows/processMessageEditing';

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

	public input: HTMLTextAreaElement | undefined;

	public composer: ComposerAPI | undefined;

	public readonly data: DataAPI;

	public readonly uploads: UploadsAPI;

	public constructor(private params: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		this.data = createDataAPI({ rid: params.rid, tmid: params.tmid });
		this.uploads = createUploadsAPI({ rid: params.rid, tmid: params.tmid });
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
					this.clearCurrentDraft();
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
				if (!this.composer || !this.messageEditingState.id) {
					return;
				}

				delete this.messageEditingState.drafts[this.messageEditingState.id];
				this.currentEditing?.stop();
			},
		};
	}

	private clearCurrentDraft() {
		if (!this.messageEditingState.id) {
			return;
		}

		delete this.messageEditingState.drafts[this.messageEditingState.id];
	}

	private async processMessageSend(message: IMessage) {
		if (await this.processSetReaction(message)) {
			return;
		}

		this.clearCurrentDraft();

		if (await this.processTooLongMessage(message)) {
			return;
		}

		if (this.messageEditingState.id && (await this.flows.processMessageEditing({ ...message, _id: this.messageEditingState.id }))) {
			this.currentEditing?.stop();
			return;
		}

		KonchatNotification.removeRoomNotification(message.rid);

		if (await this.flows.processSlashCommand(message)) {
			return;
		}

		await callWithErrorHandling('sendMessage', message);
	}

	private async processSetReaction({ msg }: Pick<IMessage, 'msg'>) {
		const match = msg.trim().match(/^\+(:.*?:)$/m);
		if (!match) {
			return false;
		}

		const [, reaction] = match;
		if (!emoji.list[reaction]) {
			return false;
		}

		const lastMessage = await this.data.findLastMessage();

		if (!lastMessage) {
			return false;
		}

		await callWithErrorHandling('setReaction', reaction, lastMessage._id);
		return true;
	}

	private async processTooLongMessage({ msg }: Pick<IMessage, 'msg'>) {
		const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(msg);
		if (messageProperties.length(adjustedMessage) <= settings.get('Message_MaxAllowedSize') && msg) {
			return false;
		}

		if (
			!settings.get('FileUpload_Enabled') ||
			!settings.get('Message_AllowConvertLongMessagesToAttachment') ||
			this.messageEditingState.id
		) {
			throw new Error(t('Message_too_long'));
		}

		const { input } = this;
		const user = Meteor.user();

		if (!input || !user) {
			throw new Error('Input or user is not defined');
		}

		const onConfirm = () => {
			const contentType = 'text/plain';
			const messageBlob = new Blob([msg], { type: contentType });
			const fileName = `${user.username} - ${new Date()}.txt`;
			const file = new File([messageBlob], fileName, {
				type: contentType,
				lastModified: Date.now(),
			});
			this.flows.uploadFiles([file]);
			imperativeModal.close();
		};

		const onClose = () => {
			this.composer?.setText(msg);
			imperativeModal.close();
		};

		imperativeModal.open({
			component: GenericModal,
			props: {
				title: t('Message_too_long'),
				children: t('Send_it_as_attachment_instead_question'),
				onConfirm,
				onClose,
				onCancel: onClose,
				variant: 'warning',
			},
		});

		return true;
	}

	private release() {
		this.composer?.release();
		if (this.currentEditing) {
			const { tmid } = this.params;
			if (!tmid) {
				this.clearCurrentDraft();
				this.currentEditing.stop();
			}
			this.composer?.clear();
		}
	}

	public flows: ChatAPI['flows'] = {
		uploadFiles: uploadFiles.bind(null, this),
		sendMessage: (async (chat: ChatAPI, { text, tshow }: { text: string; tshow?: boolean }) => {
			if (!(await chat.data.isSubscribedToRoom())) {
				try {
					await chat.data.joinRoom();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}
			}

			let msg = text.trim();

			if (!msg && !chat.currentEditing) {
				// Nothing to do
				return;
			}

			if (msg) {
				const replies = chat.composer?.quotedMessages.get() ?? [];
				msg = await prependReplies(msg, replies);

				await chat.data.markRoomAsRead();

				// don't add tmid or tshow if the message isn't part of a thread (it can happen if editing the main message of a thread)
				const originalEditingMessage = chat.currentEditing ? await chat.data.findMessageByID(chat.currentEditing.mid) : undefined;
				let { tmid } = this.params;
				if (originalEditingMessage && tmid && !originalEditingMessage.tmid) {
					tmid = undefined;
					tshow = undefined;
				}

				const { rid } = this.params;
				const message = (await onClientBeforeSendMessage({
					_id: getRandomId(),
					rid,
					tshow,
					tmid,
					msg,
				})) as IMessage;

				try {
					await this.processMessageSend(message);
					chat.composer?.dismissAllQuotedMessages();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
				return;
			}

			if (chat.currentEditing) {
				const originalMessage = await chat.data.findMessageByID(chat.currentEditing.mid);

				if (!originalMessage) {
					dispatchToastMessage({ type: 'warning', message: t('Message_not_found') });
					return;
				}

				try {
					if (await chat.flows.processMessageEditing({ ...originalMessage, msg: '' })) {
						chat.currentEditing.stop();
						return;
					}

					await chat.currentEditing?.reset();
					await chat.flows.requestMessageDeletion(originalMessage);
					return;
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			}
		}).bind(this, this),
		processSlashCommand: processSlashCommand.bind(null, this),
		processMessageEditing: processMessageEditing.bind(null, this),
		requestMessageDeletion: requestMessageDeletion.bind(this, this),
	};

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
