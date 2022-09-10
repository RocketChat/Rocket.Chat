import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { KonchatNotification } from './notification';
import { fileUpload } from './fileUpload';
import { t, slashCommands, APIClient } from '../../../utils/client';
import { messageProperties, MessageTypes, readMessage } from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { Messages, Rooms, ChatMessage, ChatSubscription } from '../../../models/client';
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
import { messageBoxState } from './messageBoxState';
import { UserAction, USER_ACTIVITIES } from './UserAction';
import { keyCodes } from '../../../../client/lib/utils/keyCodes';

export class ChatMessages {
	editing: {
		element?: HTMLElement;
		id?: string;
		saved?: string;
		savedCursor?: number;
	} = {};

	records: Record<
		IMessage['_id'],
		| {
				draft: string;
		  }
		| undefined
	> = {};

	wrapper: HTMLElement | undefined;

	input: HTMLTextAreaElement | undefined;

	$input: JQuery<HTMLTextAreaElement> | undefined;

	constructor(
		public collection: Mongo.Collection<Omit<IMessage, '_id'>, IMessage> & {
			direct: Mongo.Collection<Omit<IMessage, '_id'>, IMessage>;
			queries: unknown[];
		} = ChatMessage,
	) {}

	initializeWrapper(wrapper: HTMLElement) {
		this.wrapper = wrapper;
	}

	initializeInput(input: HTMLTextAreaElement, { rid, tmid }: Pick<IMessage, 'rid' | 'tmid'>) {
		this.input = input;
		this.$input = $(this.input);

		if (!input || !rid) {
			return;
		}

		messageBoxState.restore({ rid, tmid }, input);
		this.restoreReplies();
		this.requestInputFocus();
	}

	async restoreReplies() {
		const mid = FlowRouter.getQueryParam('reply');
		if (!mid) {
			return;
		}

		const message = Messages.findOne(mid) || (await callWithErrorHandling('getSingleMessage', mid));
		if (!message) {
			return;
		}

		this.$input?.data('reply', [message]).trigger('dataChange');
	}

	requestInputFocus() {
		setTimeout(() => {
			if (this.input && window.matchMedia('screen and (min-device-width: 500px)').matches) {
				this.input.focus();
			}
		}, 200);
	}

	recordInputAsDraft() {
		const { input } = this;
		if (!input) {
			return;
		}

		const { id } = this.editing;
		if (!id) {
			return;
		}

		const message = this.collection.findOne(id);
		if (!message) {
			throw new Error('Message not found');
		}
		const draft = input.value;

		if (draft === message.msg) {
			this.clearCurrentDraft();
			return;
		}

		const record = this.records[id] || { draft };
		record.draft = draft;
		this.records[id] = record;
	}

	clearCurrentDraft() {
		const { id } = this.editing;
		if (!id) {
			return;
		}

		const hasValue = this.records[id];
		delete this.records[id];
		return !!hasValue;
	}

	resetToDraft(id: string) {
		const { input } = this;
		if (!input) {
			return;
		}

		const message = this.collection.findOne(id);
		if (!message) {
			throw new Error('Message not found');
		}

		const oldValue = input.value;
		messageBoxState.set(input, message.msg);
		return oldValue !== message.msg;
	}

	toPrevMessage() {
		const { element } = this.editing;
		if (!element) {
			const messages = Array.from(this.wrapper?.querySelectorAll('[data-own="true"]') ?? []);
			const message = messages.pop();
			return message && this.edit(message as HTMLElement, false);
		}

		for (let previous = element.previousElementSibling; previous; previous = previous.previousElementSibling) {
			if (previous.matches('[data-own="true"]')) {
				return this.edit(previous as HTMLElement, false);
			}
		}
		this.clearEditing();
	}

	toNextMessage() {
		const { element } = this.editing;
		if (element) {
			let next;
			for (next = element.nextElementSibling; next; next = next.nextElementSibling) {
				if (next.matches('[data-own="true"]')) {
					break;
				}
			}

			next ? this.edit(next as HTMLElement, true) : this.clearEditing();
		} else {
			this.clearEditing();
		}
	}

	edit(element: HTMLElement, isEditingTheNextOne?: boolean) {
		const message = this.collection.findOne(element.dataset.id);
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

		const draft = this.records[message._id];
		let msg = draft?.draft;
		msg = msg || message.msg;

		this.clearEditing();

		const { input } = this;

		if (!input) {
			return;
		}

		this.editing.element = element;
		this.editing.id = message._id;
		input.parentElement?.classList.add('editing');
		element.classList.add('editing');
		setHighlightMessage(message._id);

		if (message.attachments?.[0].description) {
			messageBoxState.set(input, message.attachments[0].description);
		} else if (msg) messageBoxState.set(input, msg);

		const cursorPosition = isEditingTheNextOne ? 0 : input.value.length;
		input.focus();
		input.setSelectionRange(cursorPosition, cursorPosition);
	}

	clearEditing() {
		const { input } = this;

		if (!input) {
			return;
		}

		if (!this.editing.element) {
			this.editing.saved = this.input?.value;
			this.editing.savedCursor = this.input?.selectionEnd;
			return;
		}

		this.recordInputAsDraft();
		input.parentElement?.classList.remove('editing');
		this.editing.element.classList.remove('editing');
		delete this.editing.id;
		delete this.editing.element;
		clearHighlightMessage();

		messageBoxState.set(input, this.editing.saved || '');
		const cursorPosition = this.editing.savedCursor ? this.editing.savedCursor : input.value.length;
		input.setSelectionRange(cursorPosition, cursorPosition);
	}

	async send(
		_event: Event,
		{ rid, tmid, value, tshow }: { rid: string; tmid?: string; value: string; tshow?: boolean },
		done: () => void = () => undefined,
	) {
		const threadsEnabled = settings.get('Threads_enabled');

		UserAction.stop(rid, USER_ACTIVITIES.USER_TYPING, { tmid });

		if (!ChatSubscription.findOne({ rid })) {
			await callWithErrorHandling('joinRoom', rid);
		}

		if (!this.input) {
			throw new Error('Input is not defined');
		}

		messageBoxState.save({ rid, tmid }, this.input);

		let msg = value.trim();
		if (msg) {
			const mention = this.$input?.data('mention-user') ?? false;
			const replies = this.$input?.data('reply') ?? [];
			if (!mention || !threadsEnabled) {
				msg = await prependReplies(msg, replies, mention);
			}

			if (mention && threadsEnabled && replies.length) {
				tmid = replies[0]._id;
			}
		}

		// don't add tmid or tshow if the message isn't part of a thread (it can happen if editing the main message of a thread)
		const originalMessage = this.collection.findOne({ _id: this.editing.id }, { fields: { tmid: 1 }, reactive: false });
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
				this.$input?.removeData('reply').trigger('dataChange');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			return done();
		}

		if (this.editing.id) {
			const message = this.collection.findOne(this.editing.id);
			if (!message) {
				throw new Error('Message not found');
			}

			try {
				if (message.attachments && message.attachments?.length > 0) {
					// @ts-ignore
					await this.processMessageEditing({ _id: this.editing.id, rid, msg: '' });
					return done();
				}

				this.resetToDraft(this.editing.id);
				this.confirmDeleteMsg(message, done);
				return;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		}

		return done();
	}

	async processMessageSend(message: IMessage) {
		if (await this.processSetReaction(message)) {
			return;
		}

		this.clearCurrentDraft();

		if (await this.processTooLongMessage(message)) {
			return;
		}

		if (this.editing.id && (await this.processMessageEditing({ ...message, _id: this.editing.id }))) {
			return;
		}

		KonchatNotification.removeRoomNotification(message.rid);

		if (await this.processSlashCommand(message)) {
			return;
		}

		await callWithErrorHandling('sendMessage', message);
	}

	async processSetReaction({ rid, tmid, msg }: Pick<IMessage, 'msg' | 'rid' | 'tmid'>) {
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

	async processTooLongMessage({ msg, rid, tmid }: Pick<IMessage, 'msg' | 'rid' | 'tmid'>) {
		const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(msg);
		if (messageProperties.length(adjustedMessage) <= settings.get('Message_MaxAllowedSize') && msg) {
			return false;
		}

		if (!settings.get('FileUpload_Enabled') || !settings.get('Message_AllowConvertLongMessagesToAttachment') || this.editing.id) {
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
			fileUpload([{ file, name: fileName }], input, { rid, tmid });
			imperativeModal.close();
		};

		const onClose = () => {
			messageBoxState.set(input, msg);
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

	async processMessageEditing(message: IMessage) {
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

	async processSlashCommand(msgObject: IMessage) {
		if (msgObject.msg[0] === '/') {
			const match = msgObject.msg.match(/^\/([^\s]+)/m);
			if (match) {
				const command = match[1];

				if (slashCommands.commands[command]) {
					const commandOptions = slashCommands.commands[command];
					const param = msgObject.msg.replace(/^\/([^\s]+)/m, '');

					if (!commandOptions.permission || hasAtLeastOnePermission(commandOptions.permission, Session.get('openedRoom'))) {
						if (commandOptions.clientOnly) {
							commandOptions.callback?.(command, param, msgObject);
						} else {
							APIClient.post('/v1/statistics.telemetry', { params: [{ eventName: 'slashCommandsStats', timestamp: Date.now(), command }] });
							const triggerId = generateTriggerId(slashCommands.commands[command].appId);
							Meteor.call('slashCommand', { cmd: command, params: param, msg: msgObject, triggerId }, (err: Error, result: never) => {
								typeof commandOptions.result === 'function' &&
									commandOptions.result(err, result, {
										cmd: command,
										params: param,
										msg: msgObject,
									});
							});
						}

						return true;
					}
				}

				if (!settings.get('Message_AllowUnrecognizedSlashCommand')) {
					console.error(TAPi18n.__('No_such_command', { command: escapeHTML(command) }));
					const invalidCommandMsg = {
						_id: Random.id(),
						rid: msgObject.rid,
						ts: new Date(),
						msg: TAPi18n.__('No_such_command', { command: escapeHTML(command) }),
						u: {
							_id: 'rocket.cat',
							username: 'rocket.cat',
							name: 'Rocket.Cat',
						},
						private: true,
					};

					this.collection.upsert({ _id: invalidCommandMsg._id }, { $set: invalidCommandMsg });
					return true;
				}
			}
		}

		return false;
	}

	confirmDeleteMsg(message: IMessage, done: () => void = () => undefined) {
		if (MessageTypes.isSystemMessage(message)) {
			return done();
		}

		const room =
			message.drid &&
			Rooms.findOne({
				_id: message.drid,
				prid: { $exists: true },
			});

		const onConfirm = () => {
			if (this.editing.id === message._id) {
				this.clearEditing();
			}

			this.deleteMsg(message);

			this.input?.focus();
			done();

			imperativeModal.close();
			dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
		};

		const onCloseModal = () => {
			imperativeModal.close();
			if (this.editing.id === message._id) {
				this.clearEditing();
			}
			this.input?.focus();
			done();
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
	}

	async deleteMsg({ _id, rid, ts }: Pick<IMessage, '_id' | 'rid' | 'ts'>) {
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

	keydown(event: KeyboardEvent) {
		const input = event.currentTarget as HTMLTextAreaElement;
		const keyCode = event.which;
		const { id } = this.editing;

		if (keyCode === keyCodes.ESCAPE && this.editing.element) {
			event.preventDefault();
			event.stopPropagation();

			if (!id || !this.resetToDraft(id)) {
				this.clearCurrentDraft();
				this.clearEditing();
				return true;
			}

			return;
		}

		if (keyCode === keyCodes.ARROW_UP || keyCode === keyCodes.ARROW_DOWN) {
			if (event.shiftKey) {
				return;
			}

			const cursorPosition = input.selectionEnd;

			if (keyCode === keyCodes.ARROW_UP) {
				if (cursorPosition === 0) {
					this.toPrevMessage();
				} else if (!event.altKey) {
					return;
				}

				if (event.altKey) {
					this.input?.setSelectionRange(0, 0);
				}
			} else {
				if (cursorPosition === input.value.length) {
					this.toNextMessage();
				} else if (!event.altKey) {
					return;
				}

				if (event.altKey) {
					this.input?.setSelectionRange(this.input.value.length, this.input.value.length);
				}
			}

			event.preventDefault();
			event.stopPropagation();
		}
	}

	keyup(event: KeyboardEvent, { rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }) {
		const input = event.currentTarget as HTMLTextAreaElement;
		const keyCode = event.which;

		if (!Object.values<number>(keyCodes).includes(keyCode)) {
			if (input?.value.trim()) {
				UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, { tmid });
			} else {
				UserAction.stop(rid, USER_ACTIVITIES.USER_TYPING, { tmid });
			}
		}

		messageBoxState.save({ rid, tmid }, input);
	}

	onDestroyed(rid: IRoom['_id'], tmid?: IMessage['_id']) {
		UserAction.cancel(rid);
		// TODO: check why we need too many ?. here :(
		if (this.input?.parentElement?.classList.contains('editing') === true) {
			if (!tmid) {
				this.clearCurrentDraft();
				this.clearEditing();
			}
			messageBoxState.set(this.input, '');
			messageBoxState.save({ rid, tmid }, this.input);
		}
	}
}

export const chatMessages: Record<IRoom['_id'], ChatMessages> = {};
