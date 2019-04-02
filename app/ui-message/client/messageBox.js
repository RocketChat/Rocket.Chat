import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { EmojiPicker } from '../../emoji';
import { katex } from '../../katex/client';
import { Markdown } from '../../markdown/client';
import { ChatSubscription } from '../../models';
import { settings } from '../../settings';
import {
	ChatMessages,
	chatMessages,
	fileUpload,
	KonchatNotification,
} from '../../ui';
import { Layout, messageBox, popover, call } from '../../ui-utils';
import { t, roomTypes, getUserPreference } from '../../utils';
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
		condition: () => Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'bold',
		icon: 'bold',
		pattern: '**{{text}}**',
		command: 'b',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'italic',
		icon: 'italic',
		pattern: '_{{text}}_',
		command: 'i',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~{{text}}~',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'original',
	},
	{
		label: 'strike',
		icon: 'strike',
		pattern: '~~{{text}}~~',
		condition: () => Markdown && settings.get('Markdown_Parser') === 'marked',
	},
	{
		label: 'inline_code',
		icon: 'code',
		pattern: '`{{text}}`',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'multi_line',
		icon: 'multiline',
		pattern: '```\n{{text}}\n``` ',
		condition: () => Markdown && settings.get('Markdown_Parser') !== 'disabled',
	},
	{
		label: 'KaTeX',
		text: () => {
			if (!katex.isEnabled()) {
				return;
			}
			if (katex.isDollarSyntaxEnabled()) {
				return '$$KaTeX$$';
			}
			if (katex.isParenthesisSyntaxEnabled()) {
				return '\\[KaTeX\\]';
			}
		},
		link: 'https://khan.github.io/KaTeX/function-support.html',
		condition: () => katex.isEnabled(),
	},
];

function applyFormatting(pattern, input) {
	const { selectionEnd = input.value.length, selectionStart = 0 } = input;
	const initText = input.value.slice(0, selectionStart);
	const selectedText = input.value.slice(selectionStart, selectionEnd);
	const finalText = input.value.slice(selectionEnd, input.value.length);

	input.focus();

	const startPattern = pattern.substr(0, pattern.indexOf('{{text}}'));
	const startPatternFound = [...startPattern].reverse().every((char, index) => input.value.substr(selectionStart - index - 1, 1) === char);

	if (startPatternFound) {
		const endPattern = pattern.substr(pattern.indexOf('{{text}}') + '{{text}}'.length);
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

	if (!document.execCommand || !document.execCommand('insertText', false, pattern.replace('{{text}}', selectedText))) {
		input.value = initText + pattern.replace('{{text}}', selectedText) + finalText;
	}

	input.selectionStart = selectionStart + pattern.indexOf('{{text}}');
	input.selectionEnd = input.selectionStart + selectedText.length;
	$(input).change();
}


Template.messageBox.onCreated(function() {
	EmojiPicker.init();
	this.replyMessageData = new ReactiveVar();
	this.isMessageFieldEmpty = new ReactiveVar(true);
	this.isMicrophoneDenied = new ReactiveVar(true);
	this.sendIconDisabled = new ReactiveVar(false);
	messageBox.emit('created', this);
});

Template.messageBox.onRendered(function() {
	const { rid } = this.data;
	this.autorun(() => {
		const subscribed = roomTypes.verifyCanSendMessage(rid);

		Tracker.afterFlush(() => {
			const input = subscribed && this.find('.js-input-message');

			if (!input) {
				return;
			}

			const $input = $(input);

			$input.on('dataChange', () => {
				const messages = $input.data('reply') || [];
				this.replyMessageData.set(messages);
			});

			$input.autogrow({
				animate: true,
				onInitialize: true,
			})
				.on('autogrow', () => {
					this.data && this.data.onResize && this.data.onResize();
				});

			chatMessages[rid] = chatMessages[rid] || new ChatMessages;
			chatMessages[rid].input = input;
		});
	});
});

Template.messageBox.helpers({
	isEmbedded() {
		return Layout.isEmbedded();
	},
	subscribed() {
		return roomTypes.verifyCanSendMessage(this.rid);
	},
	canSend() {
		if (roomTypes.readOnly(this.rid, Meteor.user())) {
			return false;
		}
		if (roomTypes.archived(this.rid)) {
			return false;
		}
		const roomData = Session.get(`roomData${ this.rid }`);
		if (roomData && roomData.t === 'd') {
			const subscription = ChatSubscription.findOne({
				rid: this.rid,
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
		return getUserPreference(Meteor.userId(), 'useEmojis');
	},
	maxMessageLength() {
		return settings.get('Message_AllowConvertLongMessagesToAttachment') ? null : settings.get('Message_MaxAllowedSize');
	},
	isSendIconDisabled() {
		return !Template.instance().sendIconDisabled.get();
	},
	actions() {
		const actionGroups = messageBox.actions.get();
		return Object.values(actionGroups)
			.reduce((actions, actionGroup) => [...actions, ...actionGroup], []);
	},
	isAnonymousOrJoinCode() {
		const room = Session.get(`roomData${ this.rid }`);
		return !Meteor.userId() || (!ChatSubscription.findOne({
			rid: this.rid,
		}) && room && room.joinCodeRequired);
	},
	formattingButtons() {
		return formattingButtons.filter(({ condition }) => !condition || condition());
	},
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

Template.messageBox.events({
	'click .js-join'(event) {
		event.stopPropagation();
		event.preventDefault();

		const joinCodeInput = Template.instance().find('[name=joinCode]');
		const joinCode = joinCodeInput && joinCodeInput.value;

		call('joinRoom', this.rid, joinCode);
	},
	'click .js-emoji-picker'(event) {
		event.stopPropagation();
		event.preventDefault();

		if (!getUserPreference(Meteor.userId(), 'useEmojis')) {
			return;
		}

		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
			return;
		}

		EmojiPicker.open(event.currentTarget, (emoji) => {
			const emojiValue = `:${ emoji }: `;
			const { input } = chatMessages[this.rid];

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
		KonchatNotification.removeRoomNotification(this.rid);
		if (chatMessages[this.rid]) {
			chatMessages[this.rid].input = instance.find('.js-input-message');
		}
	},
	'keyup .js-input-message'(event, instance) {
		chatMessages[this.rid].keyup(this.rid, event, instance);
		instance.isMessageFieldEmpty.set(chatMessages[this.rid].isEmpty());
	},
	'paste .js-input-message'(event, instance) {
		const { input } = chatMessages[this.rid];
		setTimeout(() => {
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
			fileUpload(files, input);
			return;
		}

		instance.isMessageFieldEmpty.set(false);
	},
	'input .js-input-message'(event, instance) {
		instance.sendIconDisabled.set(event.target.value !== '');
		chatMessages[this.rid].valueChanged(this.rid, event, instance);
	},
	'propertychange .js-input-message'(event, instance) {
		if (event.originalEvent.propertyName === 'value') {
			chatMessages[this.rid].valueChanged(this.rid, event, instance);
		}
	},
	async 'click .js-send'(event, instance) {
		const { input } = chatMessages[this.rid];
		chatMessages[this.rid].send(this.rid, input, () => {
			input.updateAutogrow();
			instance.isMessageFieldEmpty.set(chatMessages[this.rid].isEmpty());
			input.focus();
		});
	},
	'click .js-action-menu'(event, instance) {
		const groups = messageBox.actions.get();
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
				rid: this.rid,
				messageBox: instance.firstNode,
			},
			activeElement: event.currentTarget,
		};

		popover.open(config);
	},
	'click .js-message-actions .js-message-action'(event, instance) {
		const { id } = event.currentTarget.dataset;
		const actions = messageBox.actions.getById(id);
		actions
			.filter(({ action }) => !!action)
			.forEach(({ action }) => {
				action.call(null, {
					rid: this.rid,
					messageBox: instance.firstNode,
					event,
				});
			});
	},
	'click .js-format'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const { id } = event.currentTarget.dataset;
		const { pattern } = formattingButtons
			.filter(({ condition }) => !condition || condition())
			.find(({ label }) => label === id) || {};

		if (!pattern) {
			return;
		}

		const input = instance.find('.js-input-message');
		applyFormatting(pattern, input);
	},
	'keydown .js-input-message'(event, instance) {
		const isMacOS = navigator.platform.indexOf('Mac') !== -1;
		const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);
		const key = event.key.toLowerCase();

		if (isCmdOrCtrlPressed) {
			event.preventDefault();
			event.stopPropagation();

			const { pattern } = formattingButtons
				.filter(({ condition }) => !condition || condition())
				.find(({ command }) => command === key) || {};

			if (!pattern) {
				return;
			}

			const input = instance.find('.js-input-message');
			applyFormatting(pattern, input);
			return;
		}

		chatMessages[this.rid].keydown(this.rid, event, instance);
	},
});
