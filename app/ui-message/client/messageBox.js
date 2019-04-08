import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { EmojiPicker } from '../../emoji';
import { settings } from '../../settings';
import {
	fileUpload,
	KonchatNotification,
} from '../../ui';
import {
	messageBox,
	popover,
	call,
	keyCodes,
	isRTL,
} from '../../ui-utils';
import {
	t,
	roomTypes,
	getUserPreference,
} from '../../utils';
import moment from 'moment';
import {
	formattingButtons,
	applyFormatting,
} from './messageBoxFormatting';
import './messageBoxReplyPreview';
import './messageBoxTyping';
import './messageBoxAudioMessage';
import './messageBoxNotSubscribed';
import './messageBox.html';


Template.messageBox.onCreated(function() {
	EmojiPicker.init();
	this.popupConfig = new ReactiveVar(null);
	this.replyMessageData = new ReactiveVar();
	this.isMicrophoneDenied = new ReactiveVar(true);
	this.sendIconDisabled = new ReactiveVar(false);
});

Template.messageBox.onRendered(function() {
	this.autorun(() => {
		const { rid, onInputChanged, onResize } = Template.currentData();

		Tracker.afterFlush(() => {
			const input = this.find('.js-input-message');

			if (this.input === input) {
				return;
			}

			this.input = input;
			onInputChanged && onInputChanged(input);

			if (input && rid) {
				this.popupConfig.set({
					rid,
					getInput: () => input,
				});
			} else {
				this.popupConfig.set(null);
			}

			if (!input) {
				return;
			}

			const $input = $(input);

			$input.on('dataChange', () => {
				const messages = $input.data('reply') || [];
				this.replyMessageData.set(messages);
			});

			$input.autogrow().on('autogrow', () => {
				onResize && onResize();
			});
		});
	});
});

Template.messageBox.helpers({
	isAnonymousOrMustJoinWithCode() {
		const { rid, subscription } = Template.currentData();
		if (!rid) {
			return false;
		}

		const roomData = Session.get(`roomData${ rid }`);
		const isAnonymous = !Meteor.userId();
		const mustJoinWithCode = !subscription && roomData && roomData.joinCodeRequired;
		return isAnonymous || mustJoinWithCode;
	},
	isWritable() {
		const { rid, subscription } = Template.currentData();
		if (!rid) {
			return true;
		}

		const roomData = Session.get(`roomData${ rid }`);
		const isReadOnly = roomTypes.readOnly(rid, Meteor.user());
		const isArchived = roomTypes.archived(rid) || (roomData && roomData.t === 'd' && subscription && subscription.archived);
		const isBlocked = (roomData && roomData.t === 'd' && subscription && subscription.blocked);
		const isBlocker = (roomData && roomData.t === 'd' && subscription && subscription.blocker);
		return !isReadOnly && !isArchived && !isBlocked && !isBlocker;
	},
	popupConfig() {
		return Template.instance().popupConfig.get();
	},
	input() {
		return Template.instance().input;
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
	canSend() {
		const { rid } = Template.currentData();
		if (!rid) {
			return true;
		}

		return roomTypes.verifyCanSendMessage(rid);
	},
	actions() {
		const actionGroups = messageBox.actions.get();
		return Object.values(actionGroups)
			.reduce((actions, actionGroup) => [...actions, ...actionGroup], []);
	},
	formattingButtons() {
		return formattingButtons.filter(({ condition }) => !condition || condition());
	},
	isBlockedOrBlocker() {
		const { rid, subscription } = Template.currentData();
		if (!rid) {
			return true;
		}

		const roomData = Session.get(`roomData${ rid }`);
		const isBlocked = (roomData && roomData.t === 'd' && subscription && subscription.blocked);
		const isBlocker = (roomData && roomData.t === 'd' && subscription && subscription.blocker);
		return isBlocked || isBlocker;
	},
});

const handleFormattingShortcut = (event, instance) => {
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;
	const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);

	if (!isCmdOrCtrlPressed) {
		return false;
	}

	const key = event.key.toLowerCase();

	const { pattern } = formattingButtons
		.filter(({ condition }) => !condition || condition())
		.find(({ command }) => command === key) || {};

	if (!pattern) {
		return false;
	}

	const { input } = instance;
	applyFormatting(pattern, input);
	return true;
};

const insertNewLine = (input) => {
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
	input.updateAutogrow();
};

const handleSubmit = (event, instance) => {
	const { data: { rid, tmid, onSend }, input } = instance;
	const { which: keyCode } = event;

	const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

	if (!isSubmitKey) {
		return false;
	}

	const sendOnEnter = getUserPreference(Meteor.userId(), 'sendOnEnter');
	const sendOnEnterActive = sendOnEnter == null || sendOnEnter === 'normal' ||
		(sendOnEnter === 'desktop' && Meteor.Device.isDesktop());
	const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
	const isSending = (sendOnEnterActive && !withModifier) || (!sendOnEnterActive && withModifier);

	if (isSending) {
		onSend && onSend.call(this, event, { rid, tmid, value: input.value }, () => {
			input.updateAutogrow();
			input.focus();
		});
		return true;
	}

	insertNewLine(input);
	return true;
};

Template.messageBox.events({
	async 'click .js-join'(event) {
		event.stopPropagation();
		event.preventDefault();

		const joinCodeInput = Template.instance().find('[name=joinCode]');
		const joinCode = joinCodeInput && joinCodeInput.value;

		await call('joinRoom', this.rid, joinCode);
	},
	'click .js-emoji-picker'(event, instance) {
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

			const { input } = instance;

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
	'focus .js-input-message'() {
		KonchatNotification.removeRoomNotification(this.rid);
	},
	'keydown .js-input-message'(event, instance) {
		const isEventHandled = handleFormattingShortcut(event, instance) || handleSubmit(event, instance);

		if (isEventHandled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		const { rid, tmid, onKeyDown } = this;
		onKeyDown && onKeyDown.call(this, event, { rid, tmid });
	},
	'keyup .js-input-message'(event) {
		const { rid, tmid, onKeyUp } = this;
		onKeyUp && onKeyUp.call(this, event, { rid, tmid });
	},
	'paste .js-input-message'(event, instance) {
		const { rid, tmid } = this;
		const { input } = instance;
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
			fileUpload(files, input, { rid, tmid });
			return;
		}
	},
	'input .js-input-message'(event, instance) {
		const { input } = instance;
		if (!input) {
			return;
		}

		instance.sendIconDisabled.set(!!input.value);

		if (input.value.length > 0) {
			input.dir = isRTL(input.value) ? 'rtl' : 'ltr';
		}

		const { rid, tmid, onValueChanged } = this;
		onValueChanged && onValueChanged.call(this, event, { rid, tmid });
	},
	'propertychange .js-input-message'(event, instance) {
		if (event.originalEvent.propertyName !== 'value') {
			return;
		}

		const { input } = instance;
		if (!input) {
			return;
		}

		instance.sendIconDisabled.set(!!input.value);

		if (input.value.length > 0) {
			input.dir = isRTL(input.value) ? 'rtl' : 'ltr';
		}

		const { rid, tmid, onValueChanged } = this;
		onValueChanged && onValueChanged.call(this, event, { rid, tmid });
	},
	async 'click .js-send'(event, instance) {
		const { input } = instance;
		const { rid, tmid, onSend } = this;
		onSend && onSend.call(this, event, { rid, tmid, value: input.value }, () => {
			input.updateAutogrow();
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
				tmid: this.tmid,
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
					tmid: this.tmid,
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

		applyFormatting(pattern, instance.input);
	},
});
