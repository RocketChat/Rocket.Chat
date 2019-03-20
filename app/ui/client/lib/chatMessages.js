import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { t, getUserPreference, slashCommands, handleError } from '../../../utils';
import { MessageAction, messageProperties, MessageTypes, readMessage, modal } from '../../../ui-utils';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises';
import { hasAtLeastOnePermission } from '../../../authorization';
import { Messages, Rooms, ChatMessage } from '../../../models';
import { emoji } from '../../../emoji';
import { KonchatNotification } from './notification';
import { MsgTyping } from './msgTyping';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';
import { fileUpload } from './fileUpload';

let sendOnEnter = '';

Meteor.startup(() => {
	Tracker.autorun(function() {
		const user = Meteor.userId();
		sendOnEnter = getUserPreference(user, 'sendOnEnter');
	});
});

export const getPermaLinks = async(replies) => {
	const promises = replies.map(async(reply) =>
		MessageAction.getPermaLink(reply._id)
	);

	return Promise.all(promises);
};

export const mountReply = async(msg, input) => {
	const replies = $(input).data('reply');
	const mentionUser = $(input).data('mention-user') || false;

	if (replies && replies.length) {
		const permalinks = await getPermaLinks(replies);

		replies.forEach(async(reply, replyIndex) => {
			if (reply !== undefined) {
				msg += `[ ](${ permalinks[replyIndex] }) `;

				const roomInfo = Rooms.findOne(reply.rid, { fields: { t: 1 } });
				if (roomInfo.t !== 'd' && reply.u.username !== Meteor.user().username && mentionUser) {
					msg += `@${ reply.u.username } `;
				}
			}
		});
	}

	return msg;
};

export const ChatMessages = class ChatMessages {
	constructor() {

		this.saveTextMessageBox = _.debounce((rid, value) => {
			const key = `messagebox_${ rid }`;
			return value.length ? localStorage.setItem(key, value) : localStorage.removeItem(key);
		}, 1000);
	}

	init(node) {
		this.editing = {};
		this.records = {};
		this.messageMaxSize = settings.get('Message_MaxAllowedSize');
		this.wrapper = $(node).find('.wrapper');
		this.input = this.input || $(node).find('.js-input-message').get(0);
		this.$input = $(this.input);
		this.hasValue = new ReactiveVar(false);
		this.bindEvents();
	}

	getEditingIndex(element) {
		const msgs = this.wrapper.get(0).querySelectorAll('.own:not(.system)');
		let index = 0;
		for (const msg of Array.from(msgs)) {
			if (msg === element) {
				return index;
			}
			index++;
		}
		return -1;
	}

	recordInputAsDraft() {
		const { id } = this.editing;

		const message = this.getMessageById(id);
		const record = this.records[id] || {};
		const draft = this.input.value;

		if (draft === message.msg) {
			return this.clearCurrentDraft();
		} else {
			record.draft = draft;
			return this.records[id] = record;
		}
	}

	getMessageDraft(id) {
		return this.records[id];
	}

	clearMessageDraft(id) {
		return delete this.records[id];
	}

	clearCurrentDraft() {
		return this.clearMessageDraft(this.editing.id);
	}

	resetToDraft(id) {
		const message = this.getMessageById(id);

		const old_value = this.input.value;
		this.input.value = message.msg;

		return old_value !== message.msg;
	}

	getMessageById(id) {
		return ChatMessage.findOne(id);
	}

	toPrevMessage() {
		const { index } = this.editing;
		return this.editByIndex((index != null) ? index - 1 : undefined);
	}

	toNextMessage() {
		const { index } = this.editing;
		if (!this.editByIndex(index + 1)) { return this.clearEditing(); }
	}

	editByIndex(index) {
		if (!this.editing.element && index) { return false; }

		const msgs = this.wrapper.get(0).querySelectorAll('.own:not(.system)');
		if (index == null) { index = msgs.length - 1; }

		if (!msgs[index]) { return false; }

		const element = msgs[index];
		this.edit(element, index);
		return true;
	}

	edit(element, index) {
		index = index != null ? index : this.getEditingIndex(element);

		const message = this.getMessageById(element.getAttribute('id'));

		const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = settings.get('Message_AllowEditing');
		const editOwn = message && message.u && message.u._id === Meteor.userId();

		if (!hasPermission && (!editAllowed || !editOwn)) { return; }
		if (element.classList.contains('system')) { return; }

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
		if (blockEditInMinutes && blockEditInMinutes !== 0) {
			let currentTsDiff;
			let msgTs;
			if (message.ts != null) { msgTs = moment(message.ts); }
			if (msgTs != null) { currentTsDiff = moment().diff(msgTs, 'minutes'); }
			if (currentTsDiff > blockEditInMinutes) {
				return;
			}
		}

		const draft = this.getMessageDraft(message._id);
		let msg = draft && draft.draft;
		msg = msg || message.msg;

		const editingNext = this.editing.index < index;

		// const old_input = this.input.value;

		this.clearEditing();

		this.hasValue.set(true);
		this.editing.element = element;
		this.editing.index = index;
		this.editing.id = message._id;
		// TODO: stop set two elements
		this.input.parentElement.classList.add('editing');
		this.input.classList.add('editing');

		element.classList.add('editing');

		if (message.attachments && message.attachments[0].description) {
			this.input.value = message.attachments[0].description;
		} else {
			this.input.value = msg;
		}
		$(this.input).trigger('change').trigger('input');

		const cursor_pos = editingNext ? 0 : -1;
		this.$input.setCursorPosition(cursor_pos);
		this.input.focus();
		return this.input;
	}

	clearEditing() {
		if (this.editing.element) {
			this.recordInputAsDraft();
			// TODO: stop set two elements
			this.input.classList.remove('editing');
			this.input.parentElement.classList.remove('editing');

			this.editing.element.classList.remove('editing');
			delete this.editing.id;
			delete this.editing.element;
			delete this.editing.index;

			this.input.value = this.editing.saved || '';
			$(this.input).trigger('change').trigger('input');
			const cursor_pos = this.editing.savedCursor != null ? this.editing.savedCursor : -1;
			this.$input.setCursorPosition(cursor_pos);

			return this.hasValue.set(this.input.value !== '');
		}
		this.editing.saved = this.input.value;
		return this.editing.savedCursor = this.input.selectionEnd;
	}
	/**
	* * @param {string} rim room ID
	* * @param {Element} input DOM element
	* * @param {function?} done callback
	*/
	async send(rid, input, done = function() {}) {
		if (s.trim(input.value) !== '') {
			readMessage.enable();
			readMessage.readNow();
			$('.message.first-unread').removeClass('first-unread');

			let msg = '';

			msg += await mountReply(msg, input);

			msg += input.value;
			$(input)
				.removeData('reply')
				.trigger('dataChange');


			if (msg.slice(0, 2) === '+:') {
				const reaction = msg.slice(1).trim();
				if (emoji.list[reaction]) {
					const lastMessage = ChatMessage.findOne({ rid }, { fields: { ts: 1 }, sort: { ts: -1 } });
					Meteor.call('setReaction', reaction, lastMessage._id);
					input.value = '';
					$(input).trigger('change').trigger('input');
					return;
				}
			}

			// Run to allow local encryption, and maybe other client specific actions to be run before send
			const msgObject = await promises.run('onClientBeforeSendMessage', { _id: Random.id(), rid, msg });

			// checks for the final msgObject.msg size before actually sending the message
			if (this.isMessageTooLong(msgObject.msg)) {
				if (settings.get('Message_AllowConvertLongMessagesToAttachment') && !this.editing.id) {
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
						fileUpload([{ file, name: fileName }]);
						this.clearCurrentDraft();
						input.value = '';
						$(input).trigger('change').trigger('input');
						this.hasValue.set(false);
						this.stopTyping(rid);
						this.saveTextMessageBox(rid, '');
						return done();
					});
				} else {
					return toastr.error(t('Message_too_long'));
				}
			}

			this.clearCurrentDraft();

			if (this.editing.id) {
				this.update(this.editing.id, rid, msgObject.msg);
				return;
			}

			KonchatNotification.removeRoomNotification(rid);
			input.value = '';
			$(input).trigger('change').trigger('input');

			if (typeof input.updateAutogrow === 'function') {
				input.updateAutogrow();
			}
			this.hasValue.set(false);
			this.stopTyping(rid);

			if (this.processSlashCommand(msgObject)) {
				return;
			}

			Meteor.call('sendMessage', msgObject);

			this.saveTextMessageBox(rid, '');

			return done();


			// If edited message was emptied we ask for deletion
		}
		if (this.editing.element) {
			const message = this.getMessageById(this.editing.id);
			if (message.attachments && message.attachments[0] && message.attachments[0].description) {
				return this.update(this.editing.id, rid, '', true);
			}
			// Restore original message in textbox in case delete is canceled
			this.resetToDraft(this.editing.id);

			return this.confirmDeleteMsg(message, done);
		}
	}

	processSlashCommand(msgObject) {
		// Check if message starts with /command
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
							Meteor.call('slashCommand', { cmd: command, params: param, msg: msgObject }, (err, result) => typeof commandOptions.result === 'function' && commandOptions.result(err, result, { cmd: command, params: param, msg: msgObject }));
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

	confirmDeleteMsg(message, done = function() {}) {
		if (MessageTypes.isSystemMessage(message)) { return; }

		const room = message.trid && Rooms.findOne({
			_id: message.trid,
			prid: { $exists: true },
		});
		modal.open({
			title: t('Are_you_sure'),
			text: room ? t('The_message_is_a_thread_you_will_not_be_able_to_recover') : t('You_will_not_be_able_to_recover'),
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
				this.clearEditing(message);
			}
			this.deleteMsg(message);

			this.$input.focus();
			return done();
		});
	}

	deleteMsg(message) {
		const forceDelete = hasAtLeastOnePermission('force-delete-message', message.rid);
		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if (blockDeleteInMinutes && forceDelete === false) {
			let msgTs;
			if (message.ts != null) { msgTs = moment(message.ts); }
			let currentTsDiff;
			if (msgTs != null) { currentTsDiff = moment().diff(msgTs, 'minutes'); }
			if (currentTsDiff > blockDeleteInMinutes) {
				toastr.error(t('Message_deleting_blocked'));
				return;
			}
		}

		return Meteor.call('deleteMessage', { _id: message._id }, function(error) {
			if (error) {
				return handleError(error);
			}
		});
	}

	pinMsg(message) {
		message.pinned = true;
		return Meteor.call('pinMessage', message, function(error) {
			if (error) {
				return handleError(error);
			}
		});
	}

	unpinMsg(message) {
		message.pinned = false;
		return Meteor.call('unpinMessage', message, function(error) {
			if (error) {
				return handleError(error);
			}
		});
	}

	update(id, rid, msg, isDescription) {
		if ((s.trim(msg) !== '') || (isDescription === true)) {
			Meteor.call('updateMessage', { _id: id, msg, rid });
			this.clearEditing();
			return this.stopTyping(rid);
		}
	}

	startTyping(rid, input) {
		if (s.trim(input.value) === '') {
			return this.stopTyping(rid);
		}
		return MsgTyping.start(rid);
	}

	stopTyping(rid) {
		return MsgTyping.stop(rid);
	}

	bindEvents() {
		if (this.wrapper && this.wrapper.length) {
			$('.input-message').autogrow();
		}
	}

	tryCompletion(input) {
		const [value] = input.value.match(/[^\s]+$/) || [];
		if (!value) { return; }
		const re = new RegExp(value, 'i');
		const user = Meteor.users.findOne({ username: re });
		if (user) {
			return input.value = input.value.replace(value, `@${ user.username } `);
		}
	}

	insertNewLine(input) {
		if (document.selection) {
			input.focus();
			const sel = document.selection.createRange();
			sel.text = '\n';
		} else if (input.selectionStart || input.selectionStart === 0) {
			const newPosition = input.selectionStart + 1;
			const before = input.value.substring(0, input.selectionStart);
			const after = input.value.substring(input.selectionEnd, input.value.length);
			input.value = `${ before }\n${ after }`;
			input.selectionStart = input.selectionEnd = newPosition;
		} else {
			input.value += '\n';
		}
		input.blur();
		input.focus();
		typeof input.updateAutogrow === 'function' && input.updateAutogrow();
	}

	restoreText(rid) {
		const text = localStorage.getItem(`messagebox_${ rid }`);
		if (typeof text === 'string' && this.input) {
			this.input.value = text;
			this.$input.trigger('input');
		}
		const msgId = FlowRouter.getQueryParam('reply');
		if (!msgId) {
			return;
		}
		const message = Messages.findOne(msgId);
		if (message) {
			return this.$input.data('reply', message).trigger('dataChange');
		}
		Meteor.call('getSingleMessage', msgId, (err, msg) => !err && this.$input.data('reply', msg).trigger('dataChange'));
	}

	keyup(rid, event) {
		let i;
		const input = event.currentTarget;
		const k = event.which;
		const keyCodes = [
			13, // Enter
			20, // Caps lock
			16, // Shift
			9, // Tab
			27, // Escape Key
			17, // Control Key
			91, // Windows Command Key
			19, // Pause Break
			18, // Alt Key
			93, // Right Click Point Key
			45, // Insert Key
			34, // Page Down
			35, // Page Up
			144, // Num Lock
			145, // Scroll Lock
		];
		for (i = 35; i <= 40; i++) { keyCodes.push(i); } // Home, End, Arrow Keys
		for (i = 112; i <= 123; i++) { keyCodes.push(i); } // F1 - F12

		if (!Array.from(keyCodes).includes(k)) {
			this.startTyping(rid, input);
		}

		this.saveTextMessageBox(rid, input.value);

		return this.hasValue.set(input.value !== '');
	}

	keydown(rid, event) {
		const { currentTarget: input, which: k } = event;

		if (k === 13 || k === 10) { // New line or carriage return
			const sendOnEnterActive = sendOnEnter == null || sendOnEnter === 'normal' ||
				(sendOnEnter === 'desktop' && Meteor.Device.isDesktop());
			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnterActive && !withModifier) || (!sendOnEnterActive && withModifier);

			event.preventDefault();
			event.stopPropagation();
			if (isSending) {
				this.send(rid, input);
			} else {
				this.insertNewLine(input);
			}

			return;
		}

		if (k === 9) { // Tab
			event.preventDefault();
			event.stopPropagation();
			this.tryCompletion(input);
		}

		if (k === 27) { // Escape
			if (this.editing.index != null) {
				// const record = this.getMessageDraft(this.editing.id);

				// If resetting did nothing then edited message is same as original
				if (!this.resetToDraft(this.editing.id)) {
					this.clearCurrentDraft();
					this.clearEditing();
				}

				event.preventDefault();
				event.stopPropagation();
				return;
			}
		} else if (k === 38 || k === 40) { // Arrow Up or down
			if (event.shiftKey) { return true; }

			const cursor_pos = input.selectionEnd;

			if (k === 38) { // Arrow Up
				if (cursor_pos === 0) {
					this.toPrevMessage();
				} else if (!event.altKey) {
					return true;
				}

				if (event.altKey) { this.$input.setCursorPosition(0); }

			} else { // Arrow Down
				if (cursor_pos === input.value.length) {
					this.toNextMessage();
				} else if (!event.altKey) {
					return true;
				}

				if (event.altKey) { this.$input.setCursorPosition(-1); }
			}

			return false;

			// ctrl (command) + shift + k -> clear room messages
		}
		// TODO
		// else if (k === 75 && navigator && navigator.platform && event.shiftKey && (navigator.platform.indexOf('Mac') !== -1 ? event.metaKey : event.ctrlKey)) {
		// 	return RoomHistoryManager.clear(rid);
		// }
	}

	valueChanged(/* rid, event*/) {
		if (this.input.value.length === 1) {
			return this.determineInputDirection();
		}
	}

	determineInputDirection() {
		return this.input.dir = this.isMessageRtl(this.input.value) ? 'rtl' : 'ltr';
	}

	// http://stackoverflow.com/a/14824756
	isMessageRtl(message) {
		const ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
		const rtlChars = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
		const rtlDirCheck = new RegExp(`^[^${ ltrChars }]*[${ rtlChars }]`);

		return rtlDirCheck.test(message);
	}

	isMessageTooLong(message) {
		const adjustedMessage = messageProperties.messageWithoutEmojiShortnames(message);
		return messageProperties.length(adjustedMessage) > this.messageMaxSize && message;
	}

	isEmpty() {
		return !this.hasValue.get();
	}
};


callbacks.add('afterLogoutCleanUp', () => {
	Object.keys(localStorage).forEach((item) => {
		if (item.indexOf('messagebox_') === 0) {
			localStorage.removeItem(item);
		}
	});
}, callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
