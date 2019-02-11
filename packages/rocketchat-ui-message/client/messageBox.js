import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import { fileUploadHandler } from 'meteor/rocketchat:file-upload';
import { settings } from 'meteor/rocketchat:settings';
import {
	ChatSubscription,
	RoomHistoryManager,
	RoomManager,
	KonchatNotification,
	popover,
	ChatMessages,
	fileUpload,
	AudioRecorder,
	chatMessages,
	MsgTyping,
} from 'meteor/rocketchat:ui';
import { call } from 'meteor/rocketchat:ui-utils';
import { t } from 'meteor/rocketchat:utils';
import toastr from 'toastr';
import moment from 'moment';
import _ from 'underscore';


const formattingButtons = [
	{
		label: 'bold',
		icon: 'bold',
		pattern: '*{{text}}*',
		command: 'b',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'bold',
		icon: 'bold',
		pattern: '**{{text}}**',
		command: 'b',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~{{text}}~',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~~{{text}}~~',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'multi_line',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
		condition: () => RocketChat.Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: () => {
			if (!RocketChat.katex.katex_enabled()) {
				return;
			}
			if (RocketChat.katex.dollar_syntax_enabled()) {
				return '$$KaTeX$$';
			}
			if (RocketChat.katex.parenthesis_syntax_enabled()) {
				return '\\[KaTeX\\]';
			}
		},
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => RocketChat.katex.katex_enabled(),
	},
];

function applyFormatting(event, template) {
	if (event.currentTarget.dataset.link) {
		return false;
	}

	event.preventDefault();
	const box = template.find('.js-input-message');
	const { selectionEnd = box.value.length, selectionStart = 0 } = box;
	const initText = box.value.slice(0, selectionStart);
	const selectedText = box.value.slice(selectionStart, selectionEnd);
	const finalText = box.value.slice(selectionEnd, box.value.length);

	const [btn] = template.findAll(`.js-md[aria-label=${ this.label }]`);
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

Template.messageBox.onCreated(function() {
	RocketChat.EmojiPicker.init();
	this.replyMessageData = new ReactiveVar();
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.sendIconDisabled = new ReactiveVar(false);
	RocketChat.messageBox.emit('created', this);
});

Template.messageBox.onRendered(function() {
	const input = this.find('.js-input-message');

	const $input = $(input);
	$input.on('dataChange', () => { // TODO: remove jQuery event layer dependency
		const reply = $input.data('reply');
		this.replyMessageData.set(reply);
	});

	$input.autogrow({
		animate: true,
		onInitialize: true,
	})
		.on('autogrow', () => {
			this.data && this.data.onResize && this.data.onResize();
		});

	chatMessages[RoomManager.openedRoom] = chatMessages[RoomManager.openedRoom] || new ChatMessages;
	chatMessages[RoomManager.openedRoom].input = input;

	input.focus();

	this.input = input;
});

Template.messageBox.helpers({
	isEmbedded() {
		return RocketChat.Layout.isEmbedded();
	},
	subscribed() {
		return RocketChat.roomTypes.verifyCanSendMessage(this._id);
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
	canSend() {
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
	popupConfig() {
		const template = Template.instance();
		return {
			getInput() {
				return template.find('.js-input-message');
			},
		};
	},
	input() {
		return Template.instance().find('.js-input-message');
	},
	replyMessageData() {
		return Template.instance().replyMessageData.get();
	},
	isEmojiEnabled() {
		return RocketChat.getUserPreference(Meteor.userId(), 'useEmojis');
	},
	maxMessageLength() {
		return settings.get('Message_MaxAllowedSize');
	},
	isSendIconDisabled() {
		return !Template.instance().sendIconDisabled.get();
	},
	isAudioMessageAllowed() {
		return (navigator.mediaDevices || navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia) &&
			settings.get('FileUpload_Enabled') &&
			settings.get('Message_AudioRecorderEnabled') &&
			(!settings.get('FileUpload_MediaTypeWhiteList') ||
			settings.get('FileUpload_MediaTypeWhiteList').match(/audio\/mp3|audio\/\*/i));
	},
	actions() {
		const actionGroups = RocketChat.messageBox.actions.get();
		return Object.values(actionGroups)
			.reduce((actions, actionGroup) => [...actions, ...actionGroup], []);
	},
	showFormattingTips() {
		return settings.get('Message_ShowFormattingTips');
	},
	formattingButtons() {
		return formattingButtons.filter((button) => !button.condition || button.condition());
	},
});

Template.messageBox.events({
	'click .emoji-picker-icon'(event) {
		event.stopPropagation();
		event.preventDefault();

		if (!RocketChat.getUserPreference(Meteor.userId(), 'useEmojis')) {
			return;
		}

		if (RocketChat.EmojiPicker.isOpened()) {
			RocketChat.EmojiPicker.close();
			return;
		}

		RocketChat.EmojiPicker.open(event.currentTarget, (emoji) => {
			const emojiValue = `:${ emoji }:`;
			const { input } = chatMessages[RoomManager.openedRoom];

			const caretPos = input.selectionStart;
			const textAreaTxt = input.value;

			input.focus();
			if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
				input.value = textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos);
				input.focus();
			}

			input.selectionStart = caretPos + emojiValue.length;
			input.selectionEnd = caretPos + emojiValue.length;
		});
	},
	'focus .js-input-message'(event, instance) {
		KonchatNotification.removeRoomNotification(this._id);
		if (chatMessages[this._id]) {
			chatMessages[this._id].input = instance.find('.js-input-message');
		}
	},
	'keyup .js-input-message'(event, instance) {
		chatMessages[this._id].keyup(this._id, event, instance);
		instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
	},
	'paste .js-input-message'(event, instance) {
		setTimeout(() => {
			const input = instance.find('.js-input-message');
			typeof input.updateAutogrow === 'function' && input.updateAutogrow();
		}, 50);

		if (!event.originalEvent.clipboardData) {
			return;
		}

		event.preventDefault();

		const files = [...event.originalEvent.clipboardData.items]
			.filter((item) => (item.kind === 'file' && item.type.indexOf('image/') !== -1))
			.map((item) => ({
				file: item.getAsFile(),
				name: `Clipboard - ${ moment().format(settings.get('Message_TimeAndDateFormat')) }`,
			}))
			.filter(({ file }) => file !== null);

		if (files.length) {
			fileUpload(files);
			return;
		}

		instance.isMessageFieldEmpty.set(false);
	},
	'keydown .js-input-message'(event, instance) {
		const isMacOS = navigator.platform.indexOf('Mac') !== -1;
		if (isMacOS && (event.metaKey || event.ctrlKey)) {
			const action = formattingButtons.find(
				(action) => action.command === event.key.toLowerCase() && (!action.condition || action.condition()));
			action && applyFormatting.apply(action, [event, instance]);
		}
		chatMessages[this._id].keydown(this._id, event, Template.instance());
	},
	'input .js-input-message'(event, instance) {
		instance.sendIconDisabled.set(event.target.value !== '');
		chatMessages[this._id].valueChanged(this._id, event, Template.instance());
	},
	'propertychange .js-input-message'(event) {
		if (event.originalEvent.propertyName === 'value') {
			chatMessages[this._id].valueChanged(this._id, event, Template.instance());
		}
	},
	'click .js-message-actions .rc-popover__item, click .js-message-actions .js-message-action'(event, instance) {
		const action = this.action || Template.parentData().action;
		action.apply(this, [{
			rid: Template.parentData()._id,
			messageBox: instance.find('.rc-message-box'),
			element: event.currentTarget,
			event,
		}]);
	},
	'click .js-send'(event, instance) {
		const input = instance.find('.js-input-message');
		chatMessages[this._id].send(this._id, input, () => {
			input.updateAutogrow();
			instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
			input.focus();
		});
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
	'click .js-md'(e, t) {
		applyFormatting.apply(this, [e, t]);
	},
});


Template.messageBox__replyPreview.events({
	'click .cancel-reply'() {
		const { input } = this;
		input.focus();
		$(input).removeData('reply').trigger('dataChange'); // TODO: remove jQuery event layer dependency
	},
});


let audioMessageIntervalId;

Template.messageBox__audioMessage.events({
	'click .js-audio-message-record'(event, instance) {
		event.preventDefault();
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');

		chatMessages[RoomManager.openedRoom].recording = true;
		AudioRecorder.start(() => {
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
	'click .js-audio-message-cross'(event, instance) {
		event.preventDefault();
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

		recording_icons.forEach((e) => { e.classList.remove('active'); });
		mic.classList.add('active');
		timer.innerHTML = '00:00';
		if (audioMessageIntervalId) {
			clearInterval(audioMessageIntervalId);
		}

		AudioRecorder.stop();
		chatMessages[RoomManager.openedRoom].recording = false;
	},
	'click .js-audio-message-check'(event, instance) {
		event.preventDefault();
		const timer = instance.find('.rc-message-box__timer');
		const mic = instance.find('.rc-message-box__icon.mic');
		const loader = instance.find('.js-audio-message-loading');
		const recording_icons = instance.findAll('.rc-message-box__icon.check, .rc-message-box__icon.cross, .rc-message-box__timer-box');

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
});


Template.messageBox__cannotSend.helpers({
	isBlockedOrBlocker() {
		const roomData = Session.get(`roomData${ this.rid }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this.rid,
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
});


Template.messageBox__notSubscribed.helpers({
	customTemplate() {
		return RocketChat.roomTypes.getNotSubscribedTpl(this.rid);
	},
	canJoinRoom() {
		return Meteor.userId() && RocketChat.roomTypes.verifyShowJoinLink(this.rid);
	},
	roomName() {
		const room = Session.get(`roomData${ this.rid }`);
		return RocketChat.roomTypes.getRoomName(room.t, room);
	},
	isJoinCodeRequired() {
		const room = Session.get(`roomData${ this.rid }`);
		return room && room.joinCodeRequired;
	},
	isAnonymousReadAllowed() {
		return (Meteor.userId() == null) &&
			settings.get('Accounts_AllowAnonymousRead') === true;
	},
	isAnonymousWriteAllowed() {
		console.log('allowAnonymousWrite');
		return (Meteor.userId() == null) &&
			settings.get('Accounts_AllowAnonymousRead') === true &&
			settings.get('Accounts_AllowAnonymousWrite') === true;
	},
});

Template.messageBox__notSubscribed.events({
	async 'click .js-join'(event) {
		event.stopPropagation();
		event.preventDefault();

		const joinCode = Template.instance().$('[name=joinCode]').val();

		try {
			await call('joinRoom', this.rid, joinCode);
			if (RocketChat.authz.hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(this.rid).loaded === 0) {
				RoomManager.getOpenedRoomByRid(this.rid).streamActive = false;
				RoomManager.getOpenedRoomByRid(this.rid).ready = false;
				RoomHistoryManager.getRoom(this.rid).loaded = null;
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
