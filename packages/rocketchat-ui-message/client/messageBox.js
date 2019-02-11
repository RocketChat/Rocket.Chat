import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { settings } from 'meteor/rocketchat:settings';
import {
	ChatSubscription,
	RoomManager,
	KonchatNotification,
	popover,
	ChatMessages,
	fileUpload,
	chatMessages,
} from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';
import moment from 'moment';
import './messageBoxReplyPreview';
import './messageBoxTyping';
import './messageBoxAudioMessage';
import './messageBoxNotSubscribed';
import './messageBox.html';


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
		label: 'KaTeX',
		text: () => {
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


function applyFormatting(event, instance) {
	event.preventDefault();
	const { input } = instance;
	const { selectionEnd = input.value.length, selectionStart = 0 } = input;
	const initText = input.value.slice(0, selectionStart);
	const selectedText = input.value.slice(selectionStart, selectionEnd);
	const finalText = input.value.slice(selectionEnd, input.value.length);

	const [btn] = instance.findAll(`.js-format[aria-label=${ this.label }]`);
	if (btn) {
		btn.classList.add('active');
		setTimeout(() => {
			btn.classList.remove('active');
		}, 100);
	}
	input.focus();

	const startPattern = this.pattern.substr(0, this.pattern.indexOf('{{text}}'));
	const startPatternFound = [...startPattern].reverse().every((char, index) => input.value.substr(selectionStart - index - 1, 1) === char);

	if (startPatternFound) {
		const endPattern = this.pattern.substr(this.pattern.indexOf('{{text}}') + '{{text}}'.length);
		const endPatternFound = [...endPattern].every((char, index) => input.value.substr(selectionEnd + index, 1) === char);

		if (endPatternFound) {
			input.selectionStart = selectionStart - startPattern.length;
			input.selectionEnd = selectionEnd + endPattern.length;

			if (!document.execCommand || !document.execCommand('insertText', false, selectedText)) {
				input.value = initText.substr(0, initText.length - startPattern.length) + selectedText + finalText.substr(endPattern.length);
			}

			input.selectionStart = selectionStart - startPattern.length;
			input.selectionEnd = input.selectionStart + selectedText.length;
			$(input).change();
			return;
		}
	}

	if (!document.execCommand || !document.execCommand('insertText', false, this.pattern.replace('{{text}}', selectedText))) {
		input.value = initText + this.pattern.replace('{{text}}', selectedText) + finalText;
	}

	input.selectionStart = selectionStart + this.pattern.indexOf('{{text}}');
	input.selectionEnd = input.selectionStart + selectedText.length;
	$(input).change();
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
	this.input = input;

	if (!input) {
		return;
	}

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
});

Template.messageBox.helpers({
	isEmbedded() {
		return RocketChat.Layout.isEmbedded();
	},
	subscribed() {
		return RocketChat.roomTypes.verifyCanSendMessage(this._id);
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
		return Template.instance().input;
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
			chatMessages[this._id].input = instance.input;
		}
	},
	'keyup .js-input-message'(event, instance) {
		chatMessages[this._id].keyup(this._id, event, instance);
		instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
	},
	'paste .js-input-message'(event, instance) {
		setTimeout(() => {
			const { input } = instance;
			typeof input.updateAutogrow === 'function' && input.updateAutogrow();
		}, 50);

		if (!event.originalEvent.clipboardData) {
			return;
		}

		const files = [...event.originalEvent.clipboardData.items]
			.filter((item) => (item.kind === 'file' && item.type.indexOf('image/') !== -1))
			.map((item) => ({
				file: item.getAsFile(),
				name: `Clipboard - ${ moment().format(settings.get('Message_TimeAndDateFormat')) }`,
			}))
			.filter(({ file }) => file !== null);

		if (files.length) {
			event.preventDefault();
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
	'click .js-send'(event, instance) {
		const { input } = instance;
		chatMessages[this._id].send(this._id, input, () => {
			input.updateAutogrow();
			instance.isMessageFieldEmpty.set(chatMessages[this._id].isEmpty());
			input.focus();
		});
	},
	'click .rc-message-box__action-menu'(event) {
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
			currentTarget: event.currentTarget.firstElementChild.firstElementChild,
			data: {
				rid: this._id,
			},
			activeElement: event.currentTarget,
		};

		popover.open(config);
	},
	'click .js-message-actions .js-message-action'(event, instance) {
		this.action.apply(this, [{
			rid: Template.parentData()._id,
			messageBox: instance.find('.rc-message-box'),
			element: event.currentTarget,
			event,
		}]);
	},
	'click .js-format'(e, t) {
		applyFormatting.apply(this, [e, t]);
	},
});
