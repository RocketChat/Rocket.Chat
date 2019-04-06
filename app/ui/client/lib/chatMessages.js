import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { t, slashCommands, handleError } from '../../../utils';
import {
	messageProperties,
	MessageTypes,
	readMessage,
	modal,
	call,
	keyCodes,
	prependReplies,
} from '../../../ui-utils';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/client';
import { hasAtLeastOnePermission } from '../../../authorization';
import { Messages, Rooms, ChatMessage, ChatSubscription } from '../../../models';
import { emoji } from '../../../emoji';
import { KonchatNotification } from './notification';
import { MsgTyping } from './msgTyping';
import _ from 'underscore';
import moment from 'moment';
import toastr from 'toastr';
import { fileUpload } from './fileUpload';

const messageBoxState = {
	saveValue: _.debounce(({ rid, tmid }, value) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		value ? localStorage.setItem(key, value) : localStorage.removeItem(key);
	}, 1000),

	restoreValue: ({ rid, tmid }) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		return localStorage.getItem(key);
	},

	restore: ({ rid, tmid }, input) => {
		const value = messageBoxState.restoreValue({ rid, tmid });
		if (typeof value === 'string') {
			messageBoxState.set(input, value);
		}
	},

	save: ({ rid, tmid }, input) => {
		messageBoxState.saveValue({ rid, tmid }, input.value);
	},

	set: (input, value) => {
		input.value = value;
		$(input).trigger('change').trigger('input');
	},

	purgeAll: () => {
		Object.keys(localStorage)
			.filter((key) => key.indexOf('messagebox_') === 0)
			.forEach((key) => localStorage.removeItem(key));
	},
};

callbacks.add('afterLogoutCleanUp', messageBoxState.purgeAll, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');

export class ChatMessages {
	init(node, { rid, tmid }) {
		this.editing = {};
		this.records = {};
		this.messageMaxSize = settings.get('Message_MaxAllowedSize');
		this.wrapper = node.querySelector('.wrapper');
		this.initializeInput(this.input || node.querySelector('.js-input-message'), { rid, tmid });
	}

	initializeInput(input, { rid, tmid }) {
		this.input = input;
		this.$input = $(this.input);

		if (!input) {
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

		const message = Messages.findOne(mid) || await call('getSingleMessage', mid);
		if (!message) {
			return;
		}

		this.$input.data('reply', [message]).trigger('dataChange');
	}

	requestInputFocus() {
		setTimeout(() => {
			if (this.input && window.matchMedia('screen and (min-device-width: 500px)').matches) {
				this.input.focus();
			}
		}, 200);
	}

	getEditingIndex(element) {
		const msgs = this.wrapper.querySelectorAll('.own:not(.system)');
		return Array.from(msgs).findIndex((msg) => msg === element);
	}

	recordInputAsDraft() {
		const message = ChatMessage.findOne(this.editing.id);
		const record = this.records[this.editing.id] || {};
		const draft = this.input.value;

		if (draft === message.msg) {
			this.clearCurrentDraft();
			return;
		}

		record.draft = draft;
		this.records[this.editing.id] = record;
	}

	clearCurrentDraft() {
		delete this.records[this.editing.id];
	}

	resetToDraft(id) {
		const message = ChatMessage.findOne(id);
		const oldValue = this.input.value;
		messageBoxState.set(this.input, message.msg);
		return oldValue !== message.msg;
	}

	toPrevMessage() {
		const { index } = this.editing;
		this.editByIndex(index ? index - 1 : undefined);
	}

	toNextMessage() {
		const { index } = this.editing;
		if (!this.editByIndex(index + 1)) {
			this.clearEditing();
		}
	}

	editByIndex(index) {
		if (!this.editing.element && index) {
			return false;
		}

		const messageElements = this.wrapper.querySelectorAll('.own:not(.system)');

		if (!index) {
			index = messageElements.length - 1;
		}

		if (!messageElements[index]) {
			return false;
		}

		const element = messageElements[index];
		this.edit(element, index);
		return true;
	}

	edit(element, index) {
		index = index || this.getEditingIndex(element);

		const message = ChatMessage.findOne(element.getAttribute('id'));

		const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = message && message.u && message.u._id === Meteor.userId();

		if (!hasPermission && (!editAllowed || !editOwn)) {
			return;
		}
		if (element.classList.contains('system')) {
			return;
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (blockEditInMinutes && blockEditInMinutes !== 0) {
			let currentTsDiff;
			let msgTs;
			if (message.ts) {
				msgTs = moment(message.ts);
			}
			if (msgTs) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			if (currentTsDiff > blockEditInMinutes) {
				return;
			}
		}

		const draft = this.records[message._id];
		let msg = draft && draft.draft;
		msg = msg || message.msg;

		const editingNext = this.editing.index < index;

		this.clearEditing();

		this.editing.element = element;
		this.editing.index = index;
		this.editing.id = message._id;
		this.input.parentElement.classList.add('editing');
		element.classList.add('editing');

		if (message.attachments && message.attachments[0].description) {
			messageBoxState.set(this.input, message.attachments[0].description);
		} else {
			messageBoxState.set(this.input, msg);
		}

		const cursorPosition = editingNext ? 0 : -1;
		this.$input.setCursorPosition(cursorPosition);
		this.input.focus();
		return this.input;
	}

	clearEditing() {
		if (!this.editing.element) {
			this.editing.saved = this.input.value;
			this.editing.savedCursor = this.input.selectionEnd;
			return;
		}

		this.recordInputAsDraft();
		this.input.parentElement.classList.remove('editing');
		this.editing.element.classList.remove('editing');
		delete this.editing.id;
		delete this.editing.element;
		delete this.editing.index;

		messageBoxState.set(this.input, this.editing.saved || '');
		const cursorPosition = this.editing.savedCursor ? this.editing.savedCursor : -1;
		this.$input.setCursorPosition(cursorPosition);
	}

	async send(event, { rid, tmid, value }, done = () => {}) {
		const threadsEnabled = false;
		if (!ChatSubscription.findOne({ rid })) {
			await call('joinRoom', rid);
		}

		if (value.trim()) {
			readMessage.enable();
			readMessage.readNow();
			$('.message.first-unread').removeClass('first-unread');

			let msg = value;
			const mention = this.$input.data('mention-user') || false;
			const replies = this.$input.data('reply') || [];
			if (!mention || !threadsEnabled) {
				msg = await prependReplies(msg, replies, mention);
			}

			this.$input.removeData('reply').trigger('dataChange');

			if (msg.slice(0, 2) === '+:') {
				const reaction = msg.slice(1).trim();
				if (emoji.list[reaction]) {
					const lastMessage = ChatMessage.findOne({ rid }, { fields: { ts: 1 }, sort: { ts: -1 } });
					await call('setReaction', reaction, lastMessage._id);
					messageBoxState.set(this.input, '');
					return;
				}
			}

			// Run to allow local encryption, and maybe other client specific actions to be run before send
			const msgObject = await promises.run('onClientBeforeSendMessage', { _id: Random.id(), rid, msg, ...(mention && threadsEnabled && replies.length && { tmid: replies[0]._id }) });

			// checks for the final msgObject.msg size before actually sending the message
			if (this.isMessageTooLong(msgObject.msg)) {
				if (!settings.get('FileUpload_Enabled') || !settings.get('Message_AllowConvertLongMessagesToAttachment') || this.editing.id) {
					return toastr.error(t('Message_too_long'));
				}
				return modal.open({
					text: t('Message_too_long_as_an_attachment_question'),
					title: '',
					type: 'warning',
					showCancelButton: true,
					confirmButtonText: t('Yes'),
					cancelButtonText: t('No'),
					closeOnConfirm: true,
				}, () => {
					const contentType = 'text/plain';
					const messageBlob = new Blob([msgObject.msg], { type: contentType });
					const fileName = `${ Meteor.user().username } - ${ new Date() }.txt`;
					const file = new File([messageBlob], fileName, { type: contentType, lastModified: Date.now() });
					fileUpload([{ file, name: fileName }], this.input, { rid });
					this.clearCurrentDraft();
					messageBoxState.set(this.input, '');
					MsgTyping.stop(rid);
					messageBoxState.save({ rid, tmid }, this.input);
					done();
				}, done);
			}

			this.clearCurrentDraft();

			if (this.editing.id) {
				await this.updateMessage(this.editing.id, rid, msgObject.msg);
				return;
			}

			KonchatNotification.removeRoomNotification(rid);
			messageBoxState.set(this.input, '');

			MsgTyping.stop(rid);

			if (this.processSlashCommand(msgObject)) {
				return;
			}

			await call('sendMessage', msgObject);

			messageBoxState.save({ rid, tmid }, this.input);

			done();
		}

		if (this.editing.id) {
			const message = ChatMessage.findOne(this.editing.id);

			const isDescription = message.attachments && message.attachments[0] && message.attachments[0].description;
			if (isDescription) {
				this.updateMessage(this.editing.id, rid, '', true);
				return;
			}

			this.resetToDraft(this.editing.id);

			if (MessageTypes.isSystemMessage(message)) {
				return;
			}

			this.confirmDeleteMsg(message, done);
			return;
		}
	}

	processSlashCommand(msgObject) {
		if (msgObject.msg[0] === '/') {
			const match = msgObject.msg.match(/^\/([^\s]+)(?:\s+(.*))?$/m);
			if (match) {
				let command;
				if (slashCommands.commands[match[1]]) {
					const commandOptions = slashCommands.commands[match[1]];
					command = match[1];
					const param = match[2] || '';

					if (!commandOptions.permission || hasAtLeastOnePermission(commandOptions.permission, Session.get('openedRoom'))) {
						if (commandOptions.clientOnly) {
							commandOptions.callback(command, param, msgObject);
						} else {
							Meteor.call('slashCommand', { cmd: command, params: param, msg: msgObject }, (err, result) => {
								typeof commandOptions.result === 'function' && commandOptions.result(err, result, { cmd: command, params: param, msg: msgObject });
							});
						}

						return true;
					}
				}

				if (!settings.get('Message_AllowUnrecognizedSlashCommand')) {
					const invalidCommandMsg = {
						_id: Random.id(),
						rid: msgObject.rid,
						ts: new Date,
						msg: TAPi18n.__('No_such_command', { command: match[1] }),
						u: {
							username: settings.get('InternalHubot_Username'),
						},
						private: true,
					};

					ChatMessage.upsert({ _id: invalidCommandMsg._id }, invalidCommandMsg);
					return true;
				}
			}
		}

		return false;
	}

	confirmDeleteMsg(message, done = () => {}) {
		const room = message.drid && Rooms.findOne({
			_id: message.drid,
			prid: { $exists: true },
		});

		modal.open({
			title: t('Are_you_sure'),
			text: room ? t('The_message_is_a_discussion_you_will_not_be_able_to_recover') : t('You_will_not_be_able_to_recover'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_delete_it'),
			cancelButtonText: t('Cancel'),
			html: false,
		}, () => {
			modal.open({
				title: t('Deleted'),
				text: t('Your_entry_has_been_deleted'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false,
			});

			if (this.editing.id === message._id) {
				this.clearEditing();
			}

			this.deleteMsg(message);

			this.$input.focus();
			done();
		});
	}

	async deleteMsg({ _id, rid, ts }) {
		const forceDelete = hasAtLeastOnePermission('force-delete-message', rid);
		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (blockDeleteInMinutes && forceDelete === false) {
			let msgTs;
			if (ts) {
				msgTs = moment(ts);
			}
			let currentTsDiff;
			if (msgTs) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			if (currentTsDiff > blockDeleteInMinutes) {
				toastr.error(t('Message_deleting_blocked'));
				return;
			}
		}

		try {
			await call('deleteMessage', { _id });
		} catch (error) {
			handleError(error);
		}
	}

	async updateMessage(_id, rid, msg, isDescription) {
		if (msg.trim() || isDescription) {
			MsgTyping.stop(rid);
			await call('updateMessage', { _id, msg, rid });
			this.clearEditing();
		}
	}

	isMessageTooLong(message) {
		const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(message);
		return messageProperties.length(adjustedMessage) > this.messageMaxSize && message;
	}

	keydown(event) {
		const { currentTarget: input, which: keyCode } = event;

		if (keyCode === keyCodes.ESCAPE && this.editing.index) {
			if (!this.resetToDraft(this.editing.id)) {
				this.clearCurrentDraft();
				this.clearEditing();
			}

			event.preventDefault();
			event.stopPropagation();
			return true;
		}

		if (keyCode === keyCodes.ARROW_UP || keyCode === keyCodes.ARROW_DOWN) {
			if (event.shiftKey) {
				return true;
			}

			const cursorPosition = input.selectionEnd;

			if (keyCode === keyCodes.ARROW_UP) {
				if (cursorPosition === 0) {
					this.toPrevMessage();
				} else if (!event.altKey) {
					return true;
				}

				if (event.altKey) {
					this.$input.setCursorPosition(0);
				}
			} else {
				if (cursorPosition === input.value.length) {
					this.toNextMessage();
				} else if (!event.altKey) {
					return true;
				}

				if (event.altKey) {
					this.$input.setCursorPosition(-1);
				}
			}

			return false;
		}
	}

	keyup(event, { rid, tmid }) {
		const { currentTarget: input, which: keyCode } = event;

		if (!Object.values(keyCodes).includes(keyCode)) {
			if (input.value.trim()) {
				MsgTyping.start(rid);
			} else {
				MsgTyping.stop(rid);
			}
		}

		messageBoxState.save({ rid, tmid }, input);
	}
}
