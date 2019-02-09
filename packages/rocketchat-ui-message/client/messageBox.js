import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import { fileUploadHandler } from 'meteor/rocketchat:file-upload';
import { ChatSubscription, RoomHistoryManager, RoomManager, KonchatNotification, popover, ChatMessages, fileUpload, AudioRecorder, chatMessages, MsgTyping } from 'meteor/rocketchat:ui';
import { call } from 'meteor/rocketchat:ui-utils';
import { t } from 'meteor/rocketchat:utils';
import toastr from 'toastr';
import moment from 'moment';
import _ from 'underscore';

let audioMessageIntervalId;

function katexSyntax() {
	if (RocketChat.katex.katex_enabled()) {
		if (RocketChat.katex.dollar_syntax_enabled()) {
			return '$$KaTeX$$';
		}
		if (RocketChat.katex.parenthesis_syntax_enabled()) {
			return '\\[KaTeX\\]';
		}
	}
	return false;
}

function applyFormatting(e, t) {
	if (e.currentTarget.dataset.link) {
		return false;
	}

	e.preventDefault();
	const box = t.find('.js-input-message');
	const { selectionEnd = box.value.length, selectionStart = 0 } = box;
	const initText = box.value.slice(0, selectionStart);
	const selectedText = box.value.slice(selectionStart, selectionEnd);
	const finalText = box.value.slice(selectionEnd, box.value.length);

	const [btn] = t.findAll(`.js-md[aria-label=${ this.label }]`);
	if (btn) {
		btn.classList.add('active');
		setTimeout(function() {
			btn.classList.remove('active');
		}, 100);
	}
	box.focus();

	const startPattern = this.pattern.substr(0, this.pattern.indexOf('{{text}}'));
	const startPatternFound = [...startPattern].reverse().every((char, index) => box.value.substr(selectionStart - index - 1, 1) === char);

	if (startPatternFound) {
		const endPattern = this.pattern.substr(this.pattern.indexOf('{{text}}') + '{{text}}'.length);
		const endPatternFound = [...endPattern].every((char, index) => box.value.substr(selectionEnd + index, 1) === char);

		if (endPatternFound) {
			box.selectionStart = selectionStart - startPattern.length;
			box.selectionEnd = selectionEnd + endPattern.length;

			if (!document.execCommand || !document.execCommand('insertText', false, selectedText)) {
				box.value = initText.substr(0, initText.length - startPattern.length) + selectedText + finalText.substr(endPattern.length);
			}

			box.selectionStart = selectionStart - startPattern.length;
			box.selectionEnd = box.selectionStart + selectedText.length;
			$(box).change();
			return;
		}
	}

	if (!document.execCommand || !document.execCommand('insertText', false, this.pattern.replace('{{text}}', selectedText))) {
		box.value = initText + this.pattern.replace('{{text}}', selectedText) + finalText;
	}

	box.selectionStart = selectionStart + this.pattern.indexOf('{{text}}');
	box.selectionEnd = box.selectionStart + selectedText.length;
	$(box).change();
}


const formattingButtons = [
	{
		label: 'bold',
		icon: 'bold',
		pattern: '*{{text}}*',
		command: 'b',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'bold',
		icon: 'bold',
		pattern: '**{{text}}**',
		command: 'b',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~{{text}}~',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~~{{text}}~~',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'multi_line',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
		condition: () => RocketChat.Markdown && RocketChat.settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: katexSyntax,
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => RocketChat.katex.katex_enabled(),
	},
];

Template.messageBox.helpers({
	showFormattingTips() {
		return RocketChat.settings.get('Message_ShowFormattingTips');
	},
	formattingButtons() {
		return formattingButtons.filter((button) => !button.condition || button.condition());
	},
	allowedToSend() {
		if (RocketChat.roomTypes.readOnly(this._id, Meteor.user())) {
			return false;
		}
		if (RocketChat.roomTypes.archived(this._id)) {
			return false;
		}
		const roomData = Session.get(`roomData${ this._id }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this._id,
			}, {
				fields: {
					archived: 1,
					blocked: 1,
					blocker: 1,
				},
			});
			if (subscription && (subscription.archived || subscription.blocked || subscription.blocker)) {
				return false;
			}
		}
		return true;
	},
	isBlockedOrBlocker() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this._id,
			}, {
				fields: {
					blocked: 1,
					blocker: 1,
				},
			});
			if (subscription && (subscription.blocked || subscription.blocker)) {
				return true;
			}
		}
	},
	getPopupConfig() {
		const template = Template.instance();
		return {
			getInput() {
				return template.find('.js-input-message');
			},
		};
	},
	usersTyping() {
		const maxUsernames = 4;
		const users = MsgTyping.get(this._id);
		if (users.length === 0) {
			return;
		}
		if (users.length === 1) {
			return {
				multi: false,
				selfTyping: MsgTyping.selfTyping.get(),
				users: users[0],
			};
		}
		let last = users.pop();
		if (users.length >= maxUsernames) {
			last = t('others');
		}
		let usernames = users.slice(0, maxUsernames - 1).join(', ');
		usernames = [usernames, last];
		return {
			multi: true,
			selfTyping: MsgTyping.selfTyping.get(),
			users: usernames.join(` ${ t('and') } `),
		};
	},
	groupAttachHidden() {
		if (RocketChat.settings.get('Message_Attachments_GroupAttach')) {
			return 'hidden';
		}
	},

	/** Helpers when not subscribed to the room */
	notSubscribedTpl() {
		return RocketChat.roomTypes.getNotSubscribedTpl(this._id);
	},
	canJoin() {
		return Meteor.userId() && RocketChat.roomTypes.verifyShowJoinLink(this._id);
	},
	roomName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) {
			return '';
		}
		if (roomData.t === 'd') {
			const chat = ChatSubscription.findOne({ rid: this._id }, { fields: { name: 1 } });
			return chat && chat.name;
		} else {
			return roomData.name;
		}
	},
	joinCodeRequired() {
		const code = Session.get(`roomData${ this._id }`);
		return code && code.joinCodeRequired;
	},
	subscribed() {
		return RocketChat.roomTypes.verifyCanSendMessage(this._id);
	},
	anonymousRead() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true;
	},
	anonymousWrite() {
		return (Meteor.userId() == null) && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true && RocketChat.settings.get('Accounts_AllowAnonymousWrite') === true;
	},
	/** Helpers when not subscribed to the room */

	disableSendIcon() {
		return !Template.instance().sendIcon.get() ? 'disabled' : '';
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	},
	isEmojiEnable() {
		return RocketChat.getUserPreference(Meteor.userId(), 'useEmojis');
	},
	dataReply() {
		return Template.instance().dataReply.get();
	},
	isAudioMessageAllowed() {
		return (navigator.mediaDevices || navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia) &&
			RocketChat.settings.get('FileUpload_Enabled') &&
			RocketChat.settings.get('Message_AudioRecorderEnabled') &&
			(!RocketChat.settings.get('FileUpload_MediaTypeWhiteList') ||
			RocketChat.settings.get('FileUpload_MediaTypeWhiteList').match(/audio\/mp3|audio\/\*/i));
	},
});

function firefoxPasteUpload(fn) {
	const user = navigator.userAgent.match(/Firefox\/(\d+)\.\d/);
	if (!user || user[1] > 49) {
		return fn;
	}
	return function(event, instance, ...args) {
		if ((event.originalEvent.ctrlKey || event.originalEvent.metaKey) && (event.keyCode === 86)) {
			const textarea = instance.find('textarea');
			const { selectionStart, selectionEnd } = textarea;
			const contentEditableDiv = instance.find('#msg_contenteditable');
			contentEditableDiv.focus();
			Meteor.setTimeout(function() {
				const pastedImg = contentEditableDiv.querySelector('img');
				const textareaContent = textarea.value;
				const startContent = textareaContent.substring(0, selectionStart);
				const endContent = textareaContent.substring(selectionEnd);
				const restoreSelection = function(pastedText) {
					textarea.value = startContent + pastedText + endContent;
					textarea.selectionStart = selectionStart + pastedText.length;
					return textarea.selectionEnd = textarea.selectionStart;
				};
				if (pastedImg) {
					contentEditableDiv.innerHTML = '';
				}
				textarea.focus;
				if (!pastedImg || contentEditableDiv.innerHTML.length > 0) {
					return [].slice.call(contentEditableDiv.querySelectorAll('br')).forEach(function(el) {
						contentEditableDiv.replaceChild(new Text('\n'), el);
						return restoreSelection(contentEditableDiv.innerText);
					});
				}
				const imageSrc = pastedImg.getAttribute('src');
				if (imageSrc.match(/^data:image/)) {
					return fetch(imageSrc).then(function(img) {
						return img.blob();
					}).then(function(blob) {
						return fileUpload([
							{
								file: blob,
								name: 'Clipboard',
							},
						]);
					});
				}
			}, 150);
		}
		return fn && fn.apply(this, [event, instance, ...args]);
	};
}

Template.messageBox.events({
	'click .js-message-actions .rc-popover__item, click .js-message-actions .js-message-action'(event, instance) {
		const action = this.action || Template.parentData().action;
		action.apply(this, [{ rid: Template.parentData()._id, messageBox: instance.find('.rc-message-box'), element: event.currentTarget, event }]);
	},
	'focus .js-input-message'(event, instance) {
		KonchatNotification.removeRoomNotification(this._id);
		if (chatMessages[this._id]) {
			chatMessages[this._id].input = instance.find('.js-input-message');
		}
	},
	'click .js-send'(event, instance) {
		const input = instance.find('.js-input-message');
		chatMessages[this._id].send(this._id, input, () => {
			// fixes https://github.com/RocketChat/Rocket.Chat/issues/3037
			// at this point, the input is cleared and ready for autogrow
			input.updateAutogrow();
			instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
			return input.focus();
		});
	},
	'click .cancel-reply'(event, instance) {
		const input = instance.find('.js-input-message');
		$(input)
			.focus()
			.removeData('reply')
			.trigger('dataChange');
	},
	'keyup .js-input-message'(event, instance) {
		chatMessages[this._id].keyup(this._id, event, instance);
		return instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
	},
	'paste .js-input-message'(e, instance) {
		Meteor.setTimeout(function() {
			const input = instance.find('.js-input-message');
			return typeof input.updateAutogrow === 'function' && input.updateAutogrow();
		}, 50);
		if (e.originalEvent.clipboardData == null) {
			return;
		}
		const items = [...e.originalEvent.clipboardData.items];
		const files = items
			.filter((item) => (item.kind === 'file' && item.type.indexOf('image/') !== -1))
			.map((item) => {
				e.preventDefault();
				return {
					file: item.getAsFile(),
					name: `Clipboard - ${ moment().format(RocketChat.settings.get('Message_TimeAndDateFormat')) }`,
				};
			});
		if (files.length) {
			return fileUpload(files);
		} else {
			return instance.isMessageFieldEmpty.set(false);
		}
	},

	'keydown .js-input-message': firefoxPasteUpload(function(event, t) {
		const isMacOS = navigator.platform.indexOf('Mac') !== -1;
		if (isMacOS && (event.metaKey || event.ctrlKey)) {
			const action = formattingButtons.find(
				(action) => action.command === event.key.toLowerCase() && (!action.condition || action.condition()));
			if (action) {
				applyFormatting.apply(action, [event, t]);
			}
		}
		return chatMessages[this._id].keydown(this._id, event, Template.instance());
	}),

	'input .js-input-message'(event, instance) {
		instance.sendIcon.set(event.target.value !== '');
		return chatMessages[this._id].valueChanged(this._id, event, Template.instance());
	},

	'propertychange .js-input-message'(event) {
		if (event.originalEvent.propertyName === 'value') {
			return chatMessages[this._id].valueChanged(this._id, event, Template.instance());
		}
	},
	'click .editing-commands-cancel > button'() {
		return chatMessages[this._id].clearEditing();
	},
	'click .editing-commands-save > button'() {
		return chatMessages[this._id].send(this._id, chatMessages[this._id].input);
	},
	'click .js-md'(e, t) {
		applyFormatting.apply(this, [e, t]);
	},
	'click .rc-message-box__action-menu'(e) {
		const groups = RocketChat.messageBox.actions.get();
		const config = {
			popoverClass: 'message-box',
			columns: [
				{
					groups: Object.keys(groups).map((group) => {
						const items = [];
						groups[group].forEach((item) => {
							items.push({
								icon: item.icon,
								name: t(item.label),
								type: 'messagebox-action',
								id: item.id,
							});
						});
						return {
							title: t(group),
							items,
						};
					}),
				},
			],
			offsetVertical: 10,
			direction: 'top-inverted',
			currentTarget: e.currentTarget.firstElementChild.firstElementChild,
			data: {
				rid: this._id,
			},
			activeElement: e.currentTarget,
		};

		popover.open(config);
	},
	'click .js-audio-message-record'(event) {
		event.preventDefault();
		const recording_icons = document.querySelectorAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');
		const timer = document.querySelector('.rc-message-box__timer');
		const mic = document.querySelector('.rc-message-box__icon.mic');

		chatMessages[RoomManager.openedRoom].recording = true;
		AudioRecorder.start(function() {
			const startTime = new Date;
			timer.innerHTML = '00:00';
			audioMessageIntervalId = setInterval(() => {
				const now = new Date;
				const distance = now - startTime;
				let minutes = Math.floor(distance / (1000 * 60));
				let seconds = Math.floor((distance % (1000 * 60)) / 1000);
				if (minutes < 10) { minutes = `0${ minutes }`; }
				if (seconds < 10) { seconds = `0${ seconds }`; }
				timer.innerHTML = `${ minutes }:${ seconds }`;
			}, 1000);

			mic.classList.remove('active');
			recording_icons.forEach((e) => { e.classList.add('active'); });
		});
	},
	'click .js-audio-message-cross'(event) {
		event.preventDefault();
		const timer = document.querySelector('.rc-message-box__timer');
		const mic = document.querySelector('.rc-message-box__icon.mic');
		const recording_icons = document.querySelectorAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

		recording_icons.forEach((e) => { e.classList.remove('active'); });
		mic.classList.add('active');
		timer.innerHTML = '00:00';
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		AudioRecorder.stop();
		chatMessages[RoomManager.openedRoom].recording = false;
	},
	'click .js-audio-message-check'(event) {
		event.preventDefault();
		const timer = document.querySelector('.rc-message-box__timer');
		const mic = document.querySelector('.rc-message-box__icon.mic');
		const loader = document.querySelector('.js-audio-message-loading');
		const recording_icons = document.querySelectorAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

		recording_icons.forEach((e) => { e.classList.remove('active'); });
		loader.classList.add('active');
		timer.innerHTML = '00:00';
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		chatMessages[RoomManager.openedRoom].recording = false;
		AudioRecorder.stop(function(blob) {

			loader.classList.remove('active');
			mic.classList.add('active');
			const roomId = RoomManager.openedRoom;
			const record = {
				name: `${ TAPi18n.__('Audio record') }.mp3`,
				size: blob.size,
				type: 'audio/mp3',
				rid: roomId,
				description: '',
			};
			const upload = fileUploadHandler('Uploads', record, blob);
			let uploading = Session.get('uploading') || [];
			uploading.push({
				id: upload.id,
				name: upload.getFileName(),
				percentage: 0,
			});
			Session.set('uploading', uploading);
			upload.onProgress = function(progress) {
				uploading = Session.get('uploading');

				const item = _.findWhere(uploading, { id: upload.id });
				if (item != null) {
					item.percentage = Math.round(progress * 100) || 0;
					return Session.set('uploading', uploading);
				}
			};

			upload.start(function(error, file, storage) {
				if (error) {
					let uploading = Session.get('uploading');
					if (!Array.isArray(uploading)) {
						uploading = [];
					}

					const item = _.findWhere(uploading, { id: upload.id });

					if (_.isObject(item)) {
						item.error = error.message;
						item.percentage = 0;
					} else {
						uploading.push({
							error: error.error,
							percentage: 0,
						});
					}

					Session.set('uploading', uploading);
					return;
				}


				if (file) {
					Meteor.call('sendFileMessage', roomId, storage, file, () => {
						Meteor.setTimeout(() => {
							const uploading = Session.get('uploading');
							if (uploading !== null) {
								const item = _.findWhere(uploading, {
									id: upload.id,
								});
								return Session.set('uploading', _.without(uploading, item));
							}
						}, 2000);
					});
				}
			});

			Tracker.autorun(function(c) {
				const cancel = Session.get(`uploading-cancel-${ upload.id }`);
				if (cancel) {
					let item;
					upload.stop();
					c.stop();

					uploading = Session.get('uploading');
					if (uploading != null) {
						item = _.findWhere(uploading, { id: upload.id });
						if (item != null) {
							item.percentage = 0;
						}
						Session.set('uploading', uploading);
					}

					return Meteor.setTimeout(function() {
						uploading = Session.get('uploading');
						if (uploading != null) {
							item = _.findWhere(uploading, { id: upload.id });
							return Session.set('uploading', _.without(uploading, item));
						}
					}, 1000);
				}
			});
		});
		return false;
	},

	'click .emoji-picker-icon'(event) {
		event.stopPropagation();
		event.preventDefault();

		if (!RocketChat.getUserPreference(Meteor.userId(), 'useEmojis')) {
			return false;
		}

		if (RocketChat.EmojiPicker.isOpened()) {
			RocketChat.EmojiPicker.close();
		} else {
			RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
				const { input } = chatMessages[RoomManager.openedRoom];

				const emojiValue = `:${ emoji }:`;

				const caretPos = input.selectionStart;
				const textAreaTxt = input.value;
				input.focus();
				if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
					input.value = textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos);
				}

				input.focus();

				input.selectionStart = caretPos + emojiValue.length;
				input.selectionEnd = caretPos + emojiValue.length;
			});
		}
	},
});

Template.messageBox.onRendered(function() {
	const input = this.find('.js-input-message'); // mssg box
	const self = this;
	$(input).on('dataChange', () => {
		const reply = $(input).data('reply');
		self.dataReply.set(reply);
	});
	chatMessages[RoomManager.openedRoom] = chatMessages[RoomManager.openedRoom] || new ChatMessages;
	chatMessages[RoomManager.openedRoom].input = this.$('.js-input-message').autogrow({
		animate: true,
		onInitialize: true,
	}).on('autogrow', () => {
		this.data && this.data.onResize && this.data.onResize();
	}).focus()[0];
});

Template.messageBox.onCreated(function() {
	RocketChat.EmojiPicker.init();
	this.dataReply = new ReactiveVar(''); // if user is replying to a mssg, this will contain data of the mssg being replied to
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.sendIcon = new ReactiveVar(false);
	RocketChat.messageBox.emit('created', this);
});

const methods = {
	actions() {
		const actionGroups = RocketChat.messageBox.actions.get();
		return Object.values(actionGroups)
			.reduce((actions, actionGroup) => [...actions, ...actionGroup], []);
	},
};
Template.messageBox__actions.helpers(methods);
Template.messageBox__actionsSmall.helpers(methods);

Template.messageBox__notSubscribed.events({
	async 'click .js-join'(event) {
		event.stopPropagation();
		event.preventDefault();

		const { rid } = this;
		const joinCode = Template.instance().$('[name=joinCode]').val();

		try {
			await call('joinRoom', rid, joinCode);
			if (RocketChat.authz.hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(rid).loaded === 0) {
				RoomManager.getOpenedRoomByRid(rid).streamActive = false;
				RoomManager.getOpenedRoomByRid(rid).ready = false;
				RoomHistoryManager.getRoom(rid).loaded = null;
				RoomManager.computation.invalidate();
			}
		} catch (error) {
			toastr.error(t(error.reason));
		}
	},

	'click .js-register'(event) {
		event.stopPropagation();
		event.preventDefault();

		Session.set('forceLogin', true);
	},

	async 'click .js-register-anonymous'(event) {
		event.stopPropagation();
		event.preventDefault();

		const { token } = await call('registerUser', {});
		Meteor.loginWithToken(token);
	},
});

Meteor.startup(() => {
	RocketChat.callbacks.add('enter-room', () => {
		// TODO: grant audio recording is stopped here
		setTimeout(() => {
			if (chatMessages[RoomManager.openedRoom].input) {
				chatMessages[RoomManager.openedRoom].input.focus();
				chatMessages[RoomManager.openedRoom].restoreText(RoomManager.openedRoom);
			}
		}, 200);
	});
});
