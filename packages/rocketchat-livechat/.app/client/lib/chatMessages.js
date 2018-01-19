/* globals MsgTyping, showError, Livechat */
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';
import visitor from '../../imports/client/visitor';

this.ChatMessages = class ChatMessages {
	init(node) {
		this.editing = {};

		// this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize')
		this.wrapper = $(node).find('.wrapper');
		this.input = $(node).find('.input-message').get(0);
		// this.bindEvents()
		return;
	}

	resize() {
		const dif = 60 + $('.messages-container').find('footer').outerHeight();
		return $('.messages-box').css({
			height: `calc(100% - ${ dif }px)`
		});
	}

	toPrevMessage() {
		const msgs = this.wrapper.get(0).querySelectorAll('.own:not(.system)');
		if (msgs.length) {
			if (this.editing.element) {
				if (msgs[this.editing.index - 1]) {
					this.edit(msgs[this.editing.index - 1], this.editing.index - 1);
				}
			} else {
				this.edit(msgs[msgs.length - 1], msgs.length - 1);
			}
		}
	}

	toNextMessage() {
		if (this.editing.element) {
			const msgs = this.wrapper.get(0).querySelectorAll('.own:not(.system)');
			if (msgs[this.editing.index + 1]) {
				this.edit(msgs[this.editing.index + 1], this.editing.index + 1);
			} else {
				this.clearEditing();
			}
		}
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

	edit(element, index) {
		if (element.classList.contains('system')) {
			return;
		}
		this.clearEditing();
		const id = element.getAttribute('id');
		const message = ChatMessage.findOne({ _id: id, 'u._id': visitor.getId() });
		this.input.value = message.msg;
		this.editing.element = element;
		this.editing.index = index || this.getEditingIndex(element);
		this.editing.id = id;
		element.classList.add('editing');
		this.input.classList.add('editing');
		setTimeout(() => {
			this.input.focus();
		}, 5);
	}

	clearEditing() {
		if (this.editing.element) {
			this.editing.element.classList.remove('editing');
			this.input.classList.remove('editing');
			this.editing.id = null;
			this.editing.element = null;
			this.editing.index = null;
			this.input.value = this.editing.saved || '';
		} else {
			this.editing.saved = this.input.value;
		}
	}

	send(rid, input) {
		if (s.trim(input.value) === '') {
			return;
		}
		if (this.isMessageTooLong(input)) {
			return toastr.error(t('Message_too_long'));
		}
		// KonchatNotification.removeRoomNotification(rid)
		const msg = input.value;
		input.value = '';
		if (!rid) {
			rid = visitor.getRoom(true);
		}

		const sendMessage = () => {
			const msgObject = {
				_id: Random.id(),
				rid,
				msg,
				token: visitor.getToken()
			};
			MsgTyping.stop(rid);

			let agent;
			const currentAgent = !visitor.roomSubscribed && Livechat.agent;
			if (currentAgent) {
				agent = {
					agentId: currentAgent._id,
					username: currentAgent.username
				};
			}

			Meteor.call('sendMessageLivechat', msgObject, agent, (error, result) => {
				if (error) {
					ChatMessage.update(msgObject._id, { $set: { error: true } });
					showError(error.reason);
				}

				if (result && result.rid && !visitor.isSubscribed(result.rid)) {
					Livechat.connecting = result.showConnecting;
					ChatMessage.update(result._id, _.omit(result, '_id'));
					Livechat.room = result.rid;

					visitor.setConnected();

					parentCall('callback', 'chat-started');
				}
			});
		};

		if (!visitor.getId()) {
			const guest = {
				token: visitor.getToken()
			};

			if (Livechat.department) {
				guest.department = Livechat.department;
			}

			Meteor.call('livechat:registerGuest', guest, (error, result) => {
				if (error) {
					return showError(error.reason);
				}

				visitor.setId(result._id);
				sendMessage();
			});
		} else {
			sendMessage();
		}
	}

	deleteMsg(message) {
		Meteor.call('deleteMessage', message, (error) => {
			if (error) {
				return handleError(error);
			}
		});
	}

	update(id, rid, input) {
		if (s.trim(input.value) !== '') {
			const msg = input.value;
			Meteor.call('updateMessage', { id, msg });
			this.clearEditing();
			MsgTyping.stop(rid);
		}
	}

	startTyping(rid, input) {
		if (s.trim(input.value) !== '') {
			MsgTyping.start(rid);
		} else {
			MsgTyping.stop(rid);
		}
	}

	bindEvents() {
		if (this.wrapper && this.wrapper.length) {
			$('.input-message').autogrow({
				postGrowCallback: () => {
					this.resize();
				}
			});
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
	}

	keydown(rid, event) {
		const input = event.currentTarget;
		const k = event.which;
		this.resize(input);
		if (k === 13 && !event.shiftKey && !event.ctrlKey && !event.altKey) { // Enter without shift/ctrl/alt
			event.preventDefault();
			event.stopPropagation();
			if (this.editing.id) {
				this.update(this.editing.id, rid, input);
			} else {
				this.send(rid, input);
			}
			return;
		}

		if (k === 27) {
			if (this.editing.id) {
				event.preventDefault();
				event.stopPropagation();
				this.clearEditing();
				return;
			}
		// else if k is 38 or k is 40 # Arrow Up or down
		// 	if k is 38
		// 		return if input.value.slice(0, input.selectionStart).match(/[\n]/) isnt null
		// 		this.toPrevMessage()
		// 	else
		// 		return if input.value.slice(input.selectionEnd, input.value.length).match(/[\n]/) isnt null
		// 		this.toNextMessage()

		// 	event.preventDefault()
		// 	event.stopPropagation()

		// ctrl (command) + shift + k -> clear room messages
		} else if (k === 75 && ((navigator.platform.indexOf('Mac') !== -1 && event.metaKey && event.shiftKey) || (navigator.platform.indexOf('Mac') === -1 && event.ctrlKey && event.shiftKey))) {
			RoomHistoryManager.clear(rid);
		}
	}

	isMessageTooLong(input) {
		return input && input.value.length > this.messageMaxSize;
	}
};
