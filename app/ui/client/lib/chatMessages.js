import moment from 'moment';
import toastr from 'toastr';
import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { KonchatNotification } from './notification';
import { MsgTyping } from './msgTyping';
import { fileUpload } from './fileUpload';
import { t, slashCommands, handleError } from '../../../utils/client';
import {
	messageProperties,
	MessageTypes,
	readMessage,
	modal,
	call,
	keyCodes,
	prependReplies,
} from '../../../ui-utils/client';
import { settings } from '../../../settings/client';
import { callbacks } from '../../../callbacks/client';
import { promises } from '../../../promises/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { Messages, Rooms, ChatMessage, ChatSubscription } from '../../../models/client';
import { emoji } from '../../../emoji/client';
import { generateTriggerId } from '../../../ui-message/client/ActionManager';


const messageBoxState = {
	saveValue: _.debounce(({ rid, tmid }, value) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		value ? Meteor._localStorage.setItem(key, value) : Meteor._localStorage.removeItem(key);
	}, 1000),

	restoreValue: ({ rid, tmid }) => {
		const key = ['messagebox', rid, tmid].filter(Boolean).join('_');
		return Meteor._localStorage.getItem(key);
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
		Object.keys(Meteor._localStorage)
			.filter((key) => key.indexOf('messagebox_') === 0)
			.forEach((key) => Meteor._localStorage.removeItem(key));
	},
};

callbacks.add('afterLogoutCleanUp', messageBoxState.purgeAll, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');

const showModal = (config) => new Promise((resolve, reject) => modal.open(config, resolve, reject));

export class ChatMessages {
	constructor(collection = ChatMessage) {
		this.collection = collection;
	}

	editing = {}

	records = {}

	initializeWrapper(wrapper) {
		this.wrapper = wrapper;
	}

	initializeInput(input, { rid, tmid }) {
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

	recordInputAsDraft() {
		const message = this.collection.findOne(this.editing.id);
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
		const hasValue = this.records[this.editing.id];
		delete this.records[this.editing.id];
		return !!hasValue;
	}

	resetToDraft(id) {
		const message = this.collection.findOne(id);
		const oldValue = this.input.value;
		messageBoxState.set(this.input, message.msg);
		return oldValue !== message.msg;
	}

	toPrevMessage() {
		const { element } = this.editing;
		if (!element) {
			const messages = Array.from(this.wrapper.querySelectorAll('.own:not(.system)'));
			const message = messages.pop();
			return message && this.edit(message, false);
		}

		for (
			let previous = element.previousElementSibling;
			previous;
			previous = previous.previousElementSibling
		) {
			if (previous.matches('.own:not(.system)')) {
				return this.edit(previous, false);
			}
		}
		this.clearEditing();
	}

	toNextMessage() {
		const { element } = this.editing;
		if (element) {
			let next;
			for (next = element.nextElementSibling; next; next = next.nextElementSibling) {
				if (next.matches('.own:not(.system)')) {
					break;
				}
			}

			next ? this.edit(next, true) : this.clearEditing();
		} else {
			this.clearEditing();
		}
	}

	edit(element, isEditingTheNextOne) {
		const message = this.collection.findOne(element.dataset.id);

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

		this.clearEditing();

		this.editing.element = element;
		this.editing.id = message._id;
		this.input.parentElement.classList.add('editing');
		element.classList.add('editing');

		if (message.attachments && message.attachments[0].description) {
			messageBoxState.set(this.input, message.attachments[0].description);
		} else {
			messageBoxState.set(this.input, msg);
		}

		const cursorPosition = isEditingTheNextOne ? 0 : -1;
		this.input.focus();
		this.$input.setCursorPosition(cursorPosition);
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

		messageBoxState.set(this.input, this.editing.saved || '');
		const cursorPosition = this.editing.savedCursor ? this.editing.savedCursor : -1;
		this.$input.setCursorPosition(cursorPosition);
	}

	async send(event, { rid, tmid, value, tshow }, done = () => {}) {
		const threadsEnabled = settings.get('Threads_enabled');

		MsgTyping.stop(rid);

		if (!ChatSubscription.findOne({ rid })) {
			await call('joinRoom', rid);
		}

		messageBoxState.save({ rid, tmid }, this.input);

		let msg = value.trim();
		if (msg) {
			const mention = this.$input.data('mention-user') || false;
			const replies = this.$input.data('reply') || [];
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

			const message = await promises.run('onClientBeforeSendMessage', {
				_id: Random.id(),
				rid,
				tshow,
				tmid,
				msg,
			});

			try {
				await this.processMessageSend(message);
				this.$input.removeData('reply').trigger('dataChange');
			} catch (error) {
				handleError(error);
			}
			return done();
		}

		if (this.editing.id) {
			const message = this.collection.findOne(this.editing.id);
			const isDescription = message.attachments && message.attachments[0] && message.attachments[0].description;

			try {
				if (isDescription) {
					await this.processMessageEditing({ _id: this.editing.id, rid, msg: '' });
					return done();
				}

				this.resetToDraft(this.editing.id);
				this.confirmDeleteMsg(message, done);
				return;
			} catch (error) {
				handleError(error);
			}
		}

		return done();
	}

	async processMessageSend(message) {
		if (await this.processSetReaction(message)) {
			return;
		}

		this.clearCurrentDraft();

		if (await this.processTooLongMessage(message)) {
			return;
		}

		if (await this.processMessageEditing({ ...message, _id: this.editing.id })) {
			return;
		}

		KonchatNotification.removeRoomNotification(message.rid);

		if (await this.processSlashCommand(message)) {
			return;
		}

		await call('sendMessage', message);
	}

	async processSetReaction({ rid, tmid, msg }) {
		if (msg.slice(0, 2) !== '+:') {
			return false;
		}

		const reaction = msg.slice(1).trim();
		if (!emoji.list[reaction]) {
			return false;
		}

		const lastMessage = this.collection.findOne({ rid, tmid }, { fields: { ts: 1 }, sort: { ts: -1 } });
		await call('setReaction', reaction, lastMessage._id);
		return true;
	}

	async processTooLongMessage({ msg, rid, tmid }) {
		const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(msg);
		if (messageProperties.length(adjustedMessage) <= settings.get('Message_MaxAllowedSize') && msg) {
			return false;
		}

		if (!settings.get('FileUpload_Enabled') || !settings.get('Message_AllowConvertLongMessagesToAttachment') || this.editing.id) {
			throw new Error({ error: 'Message_too_long' });
		}

		try {
			await showModal({
				text: t('Message_too_long_as_an_attachment_question'),
				title: '',
				type: 'warning',
				showCancelButton: true,
				confirmButtonText: t('Yes'),
				cancelButtonText: t('No'),
				closeOnConfirm: false,
			});

			const contentType = 'text/plain';
			const messageBlob = new Blob([msg], { type: contentType });
			const fileName = `${ Meteor.user().username } - ${ new Date() }.txt`;
			const file = new File([messageBlob], fileName, { type: contentType, lastModified: Date.now() });
			fileUpload([{ file, name: fileName }], this.input, { rid, tmid });
		} catch (e) {
			messageBoxState.set(this.input, msg);
			return true;
		}
		return true;
	}

	async processMessageEditing(message) {
		if (!message._id) {
			return false;
		}

		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		this.clearEditing();
		await call('updateMessage', message);
		return true;
	}

	async processSlashCommand(msgObject) {
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
							const triggerId = generateTriggerId(slashCommands.commands[command].appId);
							Meteor.call('slashCommand', { cmd: command, params: param, msg: msgObject, triggerId }, (err, result) => {
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
						ts: new Date(),
						msg: TAPi18n.__('No_such_command', { command: escapeHTML(match[1]) }),
						u: {
							username: settings.get('InternalHubot_Username') || 'rocket.cat',
						},
						private: true,
					};

					this.collection.upsert({ _id: invalidCommandMsg._id }, invalidCommandMsg);
					return true;
				}
			}
		}

		return false;
	}

	confirmDeleteMsg(message, done = () => {}) {
		if (MessageTypes.isSystemMessage(message)) {
			return done();
		}

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
		}, () => {
			if (this.editing.id === message._id) {
				this.clearEditing();
			}
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


		await call('deleteMessage', { _id });
	}

	keydown(event) {
		const { currentTarget: input, which: keyCode } = event;

		if (keyCode === keyCodes.ESCAPE && this.editing.element) {
			event.preventDefault();
			event.stopPropagation();

			if (!this.resetToDraft(this.editing.id)) {
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
					this.$input.setCursorPosition(0);
				}
			} else {
				if (cursorPosition === input.value.length) {
					this.toNextMessage();
				} else if (!event.altKey) {
					return;
				}

				if (event.altKey) {
					this.$input.setCursorPosition(-1);
				}
			}

			event.preventDefault();
			event.stopPropagation();
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

	onDestroyed(rid) {
		MsgTyping.cancel(rid);
	}
}
