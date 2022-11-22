import { Emitter } from '@rocket.chat/emitter';
import { escapeHTML } from '@rocket.chat/string-helpers';
import $ from 'jquery';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';
import type { IMessage, IRoom, SlashCommand } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { KonchatNotification } from './notification';
import { fileUpload } from './fileUpload';
import { t, slashCommands, APIClient } from '../../../utils/client';
import { messageProperties, MessageTypes, readMessage } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { Rooms, ChatMessage, ChatSubscription } from '../../../models/client';
import { emoji } from '../../../emoji/client';
import { generateTriggerId } from '../../../ui-message/client/ActionManager';
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
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import { call } from '../../../../client/lib/utils/call';

class QuotedMessages {
	private emitter = new Emitter<{ update: void }>();

	private messages: IMessage[] = [];

	public get(): IMessage[] {
		return this.messages;
	}

	public add(message: IMessage): void {
		this.messages = [...this.messages.filter((_message) => _message._id !== message._id), message];
		this.emitter.emit('update');
	}

	public remove(mid: IMessage['_id']): void {
		this.messages = this.messages.filter((message) => message._id !== mid);
		this.emitter.emit('update');
	}

	public clear(): void {
		this.messages = [];
		this.emitter.emit('update');
	}

	public subscribe(callback: () => void): () => void {
		return this.emitter.on('update', callback);
	}
}

class ComposerState {
	private emitter = new Emitter<{ update: void }>();

	private key: string;

	private state: string | undefined;

	public constructor(id: string) {
		this.key = `messagebox_${id}`;
		this.state = Meteor._localStorage.getItem(this.key) ?? undefined;
	}

	public get() {
		return this.state;
	}

	private persist = withDebouncing({ wait: 1000 })(() => {
		if (this.state) {
			Meteor._localStorage.setItem(this.key, this.state);
			return;
		}

		Meteor._localStorage.removeItem(this.key);
	});

	public update(value: string | undefined) {
		this.state = value;
		this.persist();
		this.emitter.emit('update');
	}

	public subscribe(callback: () => void): () => void {
		return this.emitter.on('update', callback);
	}

	public static purgeAll() {
		Object.keys(Meteor._localStorage)
			.filter((key) => key.indexOf('messagebox_') === 0)
			.forEach((key) => Meteor._localStorage.removeItem(key));
	}
}

interface IMessageProcessor {
	process(message: IMessage): Promise<boolean>;
}

const performSlashCommand = (params: { cmd: string; params: string; msg: IMessage; triggerId: string }) => call('slashCommand', params);

class SlashCommandProcessor implements IMessageProcessor {
	public constructor(private collection: Mongo.Collection<Omit<IMessage, '_id'>, IMessage>) {}

	private parse(msg: string): { command: SlashCommand<string>; params: string } | undefined {
		const match = msg.match(/^\/([^\s]+)(.*)/m);

		if (!match) {
			return undefined;
		}

		const [, cmd, params] = match;
		const command = slashCommands.commands[cmd];

		if (!command) {
			return undefined;
		}

		return { command, params };
	}

	private handleUnrecognizedCommand(commandName: string, { rid }: Pick<IMessage, 'rid'>): void {
		console.error(TAPi18n.__('No_such_command', { command: escapeHTML(commandName) }));
		const invalidCommandMsg: Partial<IMessage> = {
			_id: Random.id(),
			rid,
			ts: new Date(),
			msg: TAPi18n.__('No_such_command', { command: escapeHTML(commandName) }),
			u: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
			},
			private: true,
		};

		this.collection.upsert({ _id: invalidCommandMsg._id }, { $set: invalidCommandMsg });
	}

	public async process(message: IMessage): Promise<boolean> {
		const match = this.parse(message.msg);

		if (!match) {
			return false;
		}

		const { command, params } = match;

		const { permission, clientOnly, callback: handleOnClient, result: handleResult, appId, command: commandName } = command;

		if (!permission || hasAtLeastOnePermission(permission, message.rid)) {
			if (clientOnly) {
				handleOnClient?.(commandName, params, message);
				return true;
			}

			await APIClient.post('/v1/statistics.telemetry', {
				params: [{ eventName: 'slashCommandsStats', timestamp: Date.now(), command: commandName }],
			});

			const triggerId = generateTriggerId(appId);

			const data = {
				cmd: commandName,
				params,
				msg: message,
			} as const;

			try {
				const result = await performSlashCommand({ cmd: commandName, params, msg: message, triggerId });
				handleResult?.(undefined, result, data);
			} catch (error: unknown) {
				handleResult?.(error, undefined, data);
			}

			return true;
		}

		if (!settings.get('Message_AllowUnrecognizedSlashCommand')) {
			this.handleUnrecognizedCommand(commandName, message);
			return true;
		}

		return false;
	}
}

export class ChatMessages {
	public quotedMessages: QuotedMessages = new QuotedMessages();

	public composerState: ComposerState;

	public slashCommandProcessor: IMessageProcessor | undefined;

	private messageEditingState: {
		element?: HTMLElement;
		id?: string;
		savedValue?: string;
		savedCursorPosition?: number;
		drafts: Record<IMessage['_id'], string | undefined>;
	} = {
		drafts: {},
	};

	public messageEditing = {
		toPreviousMessage: (wrapper: HTMLElement | undefined) => {
			if (!this.messageEditingState.element) {
				const mid = (Array.from(wrapper?.querySelectorAll('[data-own="true"]') ?? []).pop() as HTMLElement | undefined)?.dataset.id;
				if (mid) this.messageEditing.editMessage(mid);
				return;
			}

			for (
				let previous = (this.messageEditingState.element.previousElementSibling ?? undefined) as HTMLElement | undefined;
				previous;
				previous = previous.previousElementSibling as HTMLElement | undefined
			) {
				if (previous.matches('[data-own="true"]') && previous.dataset.id) {
					this.messageEditing.editMessage(previous.dataset.id);
					return;
				}
			}

			this.clearEditing();
		},
		toNextMessage: () => {
			if (!this.messageEditingState.element) {
				this.clearEditing();
				return;
			}

			let next: HTMLElement | undefined;
			for (
				next = (this.messageEditingState.element.nextElementSibling ?? undefined) as HTMLElement | undefined;
				next;
				next = next.nextElementSibling as HTMLElement | undefined
			) {
				if (next.matches('[data-own="true"]') && next.dataset.id) {
					this.messageEditing.editMessage(next.dataset.id, { cursorAtStart: true });
					return;
				}
			}

			this.clearEditing();
		},
		editMessage: (mid: IMessage['_id'], { cursorAtStart = false }: { cursorAtStart?: boolean } = {}) => {
			const { tmid } = this.params;
			const element = document.getElementById(tmid ? `thread-${mid}` : mid);
			if (!element) {
				throw new Error('Message element not found');
			}

			const message = this.collection.findOne(mid);
			if (!message) {
				throw new Error('Message not found');
			}

			const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
			const editAllowed = settings.get('Message_AllowEditing');
			const editOwn = message?.u && message.u._id === Meteor.userId();

			if (!hasPermission && (!editAllowed || !editOwn)) {
				return;
			}

			if (MessageTypes.isSystemMessage(message)) {
				return;
			}

			const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
			if (blockEditInMinutes && blockEditInMinutes !== 0) {
				let msgTs;
				if (message.ts) {
					msgTs = moment(message.ts);
				}
				if (msgTs) {
					const currentTsDiff = moment().diff(msgTs, 'minutes');

					if (currentTsDiff > blockEditInMinutes) {
						return;
					}
				}
			}

			const draft = this.messageEditingState.drafts[message._id];
			const msg = draft || message.msg;

			this.clearEditing();

			const { input } = this;

			if (!input) {
				return;
			}

			this.messageEditingState.element = element;
			this.messageEditingState.id = message._id;
			input.parentElement?.classList.add('editing');
			element.classList.add('editing');
			setHighlightMessage(message._id);

			if (message.attachments?.[0].description) {
				this.setDraftAndUpdateInput(message.attachments[0].description);
			} else if (msg) {
				this.setDraftAndUpdateInput(msg);
			}

			const cursorPosition = cursorAtStart ? 0 : input.value.length;
			input.focus();
			input.setSelectionRange(cursorPosition, cursorPosition);
		},
	};

	public input: HTMLTextAreaElement | undefined;

	public constructor(
		private params: { rid: IRoom['_id']; tmid?: IMessage['_id'] },
		private collection: Mongo.Collection<Omit<IMessage, '_id'>, IMessage> = ChatMessage,
	) {
		this.quotedMessages.subscribe(() => {
			if (this.input) $(this.input).trigger('dataChange');
		});

		this.composerState = new ComposerState(params.rid + (params.tmid ? `-${params.tmid}` : ''));
		this.slashCommandProcessor = new SlashCommandProcessor(collection);
	}

	public setDraftAndUpdateInput(value: string | undefined) {
		this.composerState.update(value);

		if (value === undefined) return;

		if (!this.input) return;

		this.input.value = value;
		$(this.input).trigger('change').trigger('input');
	}

	public initializeInput(input: HTMLTextAreaElement) {
		this.input = input;
		this.setDraftAndUpdateInput(this.composerState.get());
	}

	private recordInputAsDraft() {
		const { input } = this;
		if (!input) {
			return;
		}

		if (!this.messageEditingState.id) {
			return;
		}

		const message = this.collection.findOne(this.messageEditingState.id);
		if (!message) {
			throw new Error('Message not found');
		}
		const draft = input.value;

		if (draft === message.msg) {
			this.clearCurrentDraft();
			return;
		}

		this.messageEditingState.drafts[this.messageEditingState.id] ||= draft;
	}

	private clearCurrentDraft() {
		if (!this.messageEditingState.id) {
			return;
		}

		const hasValue = this.messageEditingState.drafts[this.messageEditingState.id];
		delete this.messageEditingState.drafts[this.messageEditingState.id];
		return !!hasValue;
	}

	private resetToDraft(id: string) {
		const { input } = this;
		if (!input) {
			return;
		}

		const message = this.collection.findOne(id);
		if (!message) {
			throw new Error('Message not found');
		}

		const oldValue = input.value;
		this.setDraftAndUpdateInput(message.msg);
		return oldValue !== message.msg;
	}

	private clearEditing() {
		const { input } = this;

		if (!input) {
			return;
		}

		if (!this.messageEditingState.element) {
			this.messageEditingState.savedValue = this.input?.value;
			this.messageEditingState.savedCursorPosition = this.input?.selectionEnd;
			return;
		}

		this.recordInputAsDraft();
		input.parentElement?.classList.remove('editing');
		this.messageEditingState.element.classList.remove('editing');
		delete this.messageEditingState.id;
		delete this.messageEditingState.element;
		clearHighlightMessage();

		this.setDraftAndUpdateInput(this.messageEditingState.savedValue || '');
		const cursorPosition = this.messageEditingState.savedCursorPosition ? this.messageEditingState.savedCursorPosition : input.value.length;
		input.setSelectionRange(cursorPosition, cursorPosition);
	}

	public async send({ value, tshow }: { value: string; tshow?: boolean }) {
		const { rid } = this.params;
		let { tmid } = this.params;

		if (!rid) {
			throw new Error('Room ID is required');
		}

		const threadsEnabled = settings.get('Threads_enabled');

		if (!ChatSubscription.findOne({ rid })) {
			await callWithErrorHandling('joinRoom', rid);
		}

		if (!this.input) {
			throw new Error('Input is not defined');
		}

		let msg = value.trim();
		if (msg) {
			const mention = $(this.input).data('mention-user') ?? false;
			const replies = this.quotedMessages.get();
			if (!mention || !threadsEnabled) {
				msg = await prependReplies(msg, replies, mention);
			}

			if (mention && threadsEnabled && replies.length) {
				tmid = replies[0]._id;
			}
		}

		// don't add tmid or tshow if the message isn't part of a thread (it can happen if editing the main message of a thread)
		const originalMessage = this.collection.findOne({ _id: this.messageEditingState.id }, { fields: { tmid: 1 }, reactive: false });
		if (originalMessage && tmid && !originalMessage.tmid) {
			tmid = undefined;
			tshow = undefined;
		}

		if (msg) {
			readMessage.readNow(rid);
			readMessage.refreshUnreadMark(rid);

			const message = await onClientBeforeSendMessage({
				_id: Random.id(),
				rid,
				tshow,
				tmid,
				msg,
			});

			try {
				// @ts-ignore
				await this.processMessageSend(message);
				this.quotedMessages.clear();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			return;
		}

		if (this.messageEditingState.id) {
			const message = this.collection.findOne(this.messageEditingState.id);
			if (!message) {
				throw new Error('Message not found');
			}

			try {
				if (message.attachments && message.attachments?.length > 0) {
					// @ts-ignore
					await this.processMessageEditing({ _id: this.messageEditingState.id, rid, msg: '' });
					return;
				}

				this.resetToDraft(this.messageEditingState.id);
				await this.requestMessageDeletion(message);
				return;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		}
	}

	private async processMessageSend(message: IMessage) {
		if (await this.processSetReaction(message)) {
			return;
		}

		this.clearCurrentDraft();

		if (await this.processTooLongMessage(message)) {
			return;
		}

		if (this.messageEditingState.id && (await this.processMessageEditing({ ...message, _id: this.messageEditingState.id }))) {
			return;
		}

		KonchatNotification.removeRoomNotification(message.rid);

		if (await this.slashCommandProcessor?.process(message)) {
			return;
		}

		await callWithErrorHandling('sendMessage', message);
	}

	private async processSetReaction({ rid, tmid, msg }: Pick<IMessage, 'msg' | 'rid' | 'tmid'>) {
		if (msg.slice(0, 2) !== '+:') {
			return false;
		}

		const reaction = msg.slice(1).trim();
		if (!emoji.list[reaction]) {
			return false;
		}

		const lastMessage = this.collection.findOne({ rid, tmid }, { fields: { ts: 1 }, sort: { ts: -1 } });
		if (!lastMessage) {
			throw new Error('Message not found');
		}
		await callWithErrorHandling('setReaction', reaction, lastMessage._id);
		return true;
	}

	private async processTooLongMessage({ msg, rid, tmid }: Pick<IMessage, 'msg' | 'rid' | 'tmid'>) {
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
			fileUpload([file], this, { rid, tmid });
			imperativeModal.close();
		};

		const onClose = () => {
			this.setDraftAndUpdateInput(msg);
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

	private async processMessageEditing(message: IMessage) {
		if (!message._id) {
			return false;
		}

		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		this.clearEditing();
		await callWithErrorHandling('updateMessage', message);
		return true;
	}

	public async requestMessageDeletion(message: IMessage) {
		if (MessageTypes.isSystemMessage(message)) {
			return;
		}

		const room =
			message.drid &&
			Rooms.findOne({
				_id: message.drid,
				prid: { $exists: true },
			});

		await new Promise<void>((resolve) => {
			const onConfirm = () => {
				if (this.messageEditingState.id === message._id) {
					this.clearEditing();
				}

				this.deleteMessage(message);

				this.input?.focus();
				resolve();

				imperativeModal.close();
				dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
			};

			const onCloseModal = () => {
				imperativeModal.close();
				if (this.messageEditingState.id === message._id) {
					this.clearEditing();
				}
				this.input?.focus();
				resolve();
			};

			imperativeModal.open({
				component: GenericModal,
				props: {
					title: t('Are_you_sure'),
					children: room ? t('The_message_is_a_discussion_you_will_not_be_able_to_recover') : t('You_will_not_be_able_to_recover'),
					variant: 'danger',
					confirmText: t('Yes_delete_it'),
					onConfirm,
					onClose: onCloseModal,
					onCancel: onCloseModal,
				},
			});
		});
	}

	private async deleteMessage({ _id, rid, ts }: Pick<IMessage, '_id' | 'rid' | 'ts'>) {
		const forceDelete = hasAtLeastOnePermission('force-delete-message', rid);
		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (blockDeleteInMinutes && forceDelete === false) {
			const msgTs = moment(ts);
			const currentTsDiff = moment().diff(msgTs, 'minutes');

			if (currentTsDiff > blockDeleteInMinutes) {
				dispatchToastMessage({ type: 'error', message: t('Message_deleting_blocked') });
				return;
			}
		}

		await callWithErrorHandling('deleteMessage', { _id });
	}

	public handleEscapeKeyPress(event: JQuery.KeyDownEvent<HTMLTextAreaElement>) {
		if (this.messageEditingState.id) {
			event.preventDefault();
			event.stopPropagation();

			const reset = this.resetToDraft(this.messageEditingState.id);

			if (!reset) {
				this.clearCurrentDraft();
				this.clearEditing();
			}
		}
	}

	private release() {
		const { tmid } = this.params;
		// TODO: check why we need too many ?. here :(
		if (this.input?.parentElement?.classList.contains('editing') === true) {
			if (!tmid) {
				this.clearCurrentDraft();
				this.clearEditing();
			}
			this.setDraftAndUpdateInput('');
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

	public static purgeAllDrafts() {
		ComposerState.purgeAll();
	}
}
