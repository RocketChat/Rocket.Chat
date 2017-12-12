/* globals MsgTyping */
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';
this.ChatMessages = class ChatMessages {
	init(node) {
		this.editing = {};
		this.records = {};
		this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize');
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

		const hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = RocketChat.settings.get('Message_AllowEditing');
		const editOwn = message && message.u && message.u._id === Meteor.userId();

		if (!hasPermission && (!editAllowed || !editOwn)) { return; }
		if (element.classList.contains('system')) { return; }

		const blockEditInMinutes = RocketChat.settings.get('Message_AllowEditing_BlockEditInMinutes');
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
		this.$input.closest('.message-form').addClass('editing');

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
			this.$input.closest('.message-form').removeClass('editing');
			delete this.editing.id;
			delete this.editing.element;
			delete this.editing.index;

			this.input.value = this.editing.saved || '';
			$(this.input).trigger('change').trigger('input');
			const cursor_pos = this.editing.savedCursor != null ? this.editing.savedCursor : -1;
			this.$input.setCursorPosition(cursor_pos);

			return this.hasValue.set(this.input.value !== '');
		} else {
			this.editing.saved = this.input.value;
			return this.editing.savedCursor = this.input.selectionEnd;
		}
	}
	/* globals readMessage KonchatNotification */
	/**
		* * @param {string} rim room ID
		* * @param {Element} input DOM element
		* * @param {function?} done callback
		*/
	send(rid, input, done = function() {}) {
		if (s.trim(input.value) !== '') {
			readMessage.enable();
			readMessage.readNow();
			$('.message.first-unread').removeClass('first-unread');

			const msg = input.value;
			const msgObject = { _id: Random.id(), rid, msg};

			if (msg.slice(0, 2) === '+:') {
				const reaction = msg.slice(1).trim();
				if (RocketChat.emoji.list[reaction]) {
					const lastMessage = ChatMessage.findOne({rid}, { fields: { ts: 1 }, sort: { ts: -1 }});
					Meteor.call('setReaction', reaction, lastMessage._id);
					input.value = '';
					$(input).trigger('change').trigger('input');
					return;
				}
			}

			// Run to allow local encryption, and maybe other client specific actions to be run before send
			return RocketChat.promises.run('onClientBeforeSendMessage', msgObject).then(msgObject => {

				// checks for the final msgObject.msg size before actually sending the message
				if (this.isMessageTooLong(msgObject.msg)) {
					return toastr.error(t('Message_too_long'));
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

				//Check if message starts with /command
				if (msg[0] === '/') {
					const match = msg.match(/^\/([^\s]+)(?:\s+(.*))?$/m);
					if (match) {
						let command;
						if (RocketChat.slashCommands.commands[match[1]]) {
							const commandOptions = RocketChat.slashCommands.commands[match[1]];
							command = match[1];
							const param = match[2] || '';
							if (commandOptions.clientOnly) {
								commandOptions.callback(command, param, msgObject);
							} else {
								Meteor.call('slashCommand', {cmd: command, params: param, msg: msgObject }, (err, result) => typeof commandOptions.result === 'function' && commandOptions.result(err, result, {cmd: command, params: param, msg: msgObject }));
							}
							return;
						}

						if (!RocketChat.settings.get('Message_AllowUnrecognizedSlashCommand')) {
							const invalidCommandMsg = {
								_id: Random.id(),
								rid,
								ts: new Date,
								msg: TAPi18n.__('No_such_command', { command: match[1] }),
								u: {
									username: RocketChat.settings.get('InternalHubot_Username')
								},
								private: true
							};
							ChatMessage.upsert({ _id: invalidCommandMsg._id }, invalidCommandMsg);
							return;
						}
					}
				}

				Meteor.call('sendMessage', msgObject);
				return done();
			});

			// If edited message was emptied we ask for deletion
		} else if (this.editing.element) {
			const message = this.getMessageById(this.editing.id);
			if (message.attachments && message.attachments[0] && message.attachments[0].description) {
				return this.update(this.editing.id, rid, '', true);
			}
			// Restore original message in textbox in case delete is canceled
			this.resetToDraft(this.editing.id);

			return this.confirmDeleteMsg(message, done);
		}
	}

	confirmDeleteMsg(message, done = function() {}) {
		if (RocketChat.MessageTypes.isSystemMessage(message)) { return; }
		swal({
			title: t('Are_you_sure'),
			text: t('You_will_not_be_able_to_recover'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_delete_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			swal({
				title: t('Deleted'),
				text: t('Your_entry_has_been_deleted'),
				type: 'success',
				timer: 1000,
				showConfirmButton: false
			});

			if (this.editing.id === message._id) {
				this.clearEditing(message);
			}
			this.deleteMsg(message);

			this.$input.focus();
			return done();
		});

		// In order to avoid issue "[Callback not called when still animating](https://github.com/t4t5/sweetalert/issues/528)"
		return $('.sweet-alert').addClass('visible');
	}

	deleteMsg(message) {
		const forceDelete = RocketChat.authz.hasAtLeastOnePermission('force-delete-message', message.rid);
		const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
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
		if (s.trim(input.value) !== '') {
			return MsgTyping.start(rid);
		} else {
			return MsgTyping.stop(rid);
		}
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
		const user = Meteor.users.findOne({username: re});
		if (user) {
			return input.value = input.value.replace(value, `@${ user.username } `);
		}
	}

	restoreText(rid) {
		const text = localStorage.getItem(`messagebox_${ rid }`);
		if (typeof text === 'string' && this.input) {
			this.input.value = text;
		}
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
			145 // Scroll Lock
		];
		for (i = 35; i <= 40; i++) { keyCodes.push(i); } // Home, End, Arrow Keys
		for (i = 112; i <= 123; i++) { keyCodes.push(i); } // F1 - F12

		if (!Array.from(keyCodes).includes(k)) {
			this.startTyping(rid, input);
		}

		localStorage.setItem(`messagebox_${ rid }`, input.value);

		return this.hasValue.set(input.value !== '');
	}

	keydown(rid, event) {
		const user = Meteor.user();
		const sendOnEnter = RocketChat.getUserPreference(user, 'sendOnEnter');
		const input = event.currentTarget;
		// const $input = $(input);
		const k = event.which;

		if (k === 13) {
			if (sendOnEnter == null || sendOnEnter === 'normal' || sendOnEnter === 'desktop' && Meteor.Device.isDesktop()) {
				if (!event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) { // Enter without shift/ctrl/alt
					event.preventDefault();
					event.stopPropagation();
					this.send(rid, input);
					return;
				} else if (!event.shiftKey) {
					return input.value +='\n';
				}
			} else if (sendOnEnter === 'alternative') {
				if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) { // Enter with shift/ctrl/alt
					event.preventDefault();
					event.stopPropagation();
					this.send(rid, input);
					return;
				}
			}
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

	valueChanged(/*rid, event*/) {
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
		return message && message.length > this.messageMaxSize;
	}

	isEmpty() {
		return !this.hasValue.get();
	}
};


RocketChat.callbacks.add('afterLogoutCleanUp', () => {
	Object.keys(localStorage).forEach((item) => {
		if (item.indexOf('messagebox_') === 0) {
			localStorage.removeItem(item);
		}
	});
}, RocketChat.callbacks.priority.MEDIUM, 'chatMessages-after-logout-cleanup');
