import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { setupAutogrow } from './messageBoxAutogrow';
import { formattingButtons, applyFormatting } from './messageBoxFormatting';
import { EmojiPicker } from '../../../emoji';
import { Users } from '../../../models';
import { settings } from '../../../settings';
import { fileUpload, KonchatNotification } from '../../../ui';
import { messageBox, popover } from '../../../ui-utils';
import { t, getUserPreference } from '../../../utils/client';
import './messageBoxActions';
import './messageBoxReplyPreview';
import './userActionIndicator.ts';
import './messageBoxAudioMessage';
import './messageBoxNotSubscribed';
import './messageBox.html';
import './messageBoxReadOnly';
import { getImageExtensionFromMime } from '../../../../lib/getImageExtensionFromMime';
import { keyCodes } from '../../../../client/lib/utils/keyCodes';
import { isRTL } from '../../../../client/lib/utils/isRTL';
import { call } from '../../../../client/lib/utils/call';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Template.messageBox.onCreated(function () {
	this.state = new ReactiveDict();
	this.popupConfig = new ReactiveVar(null);
	this.replyMessageData = new ReactiveVar();
	this.isMicrophoneDenied = new ReactiveVar(true);
	this.isSendIconVisible = new ReactiveVar(false);

	this.set = (value) => {
		const { input } = this;
		if (!input) {
			return;
		}

		input.value = value;
		$(input).trigger('change').trigger('input');
	};

	this.insertNewLine = () => {
		const { input, autogrow } = this;
		if (!input) {
			return;
		}

		if (document.selection) {
			input.focus();
			const sel = document.selection.createRange();
			sel.text = '\n';
		} else if (input.selectionStart || input.selectionStart === 0) {
			const newPosition = input.selectionStart + 1;
			const before = input.value.substring(0, input.selectionStart);
			const after = input.value.substring(input.selectionEnd, input.value.length);
			input.value = `${before}\n${after}`;
			input.selectionStart = newPosition;
			input.selectionEnd = newPosition;
		} else {
			input.value += '\n';
		}
		$(input).trigger('change').trigger('input');

		input.blur();
		input.focus();
		autogrow.update();
	};

	this.send = (event) => {
		const { input } = this;

		if (!input) {
			return;
		}

		const {
			autogrow,
			data: { rid, tmid, onSend, tshow },
		} = this;
		const { value } = input;
		this.set('');

		if (!onSend) {
			return;
		}

		onSend.call(this.data, event, { rid, tmid, value, tshow }, () => {
			autogrow.update();
			input.focus();
		});
	};
});

Template.messageBox.onRendered(function () {
	let inputSetup = false;

	this.autorun(() => {
		const { rid, subscription } = Template.currentData();
		const room = Session.get(`roomData${rid}`);

		if (!inputSetup) {
			const $input = $(this.find('.js-input-message'));
			this.source = $input[0];
			if (this.source) {
				inputSetup = true;
			}
			$input.on('dataChange', () => {
				const messages = $input.data('reply') || [];
				this.replyMessageData.set(messages);
			});
		}

		if (!room) {
			return this.state.set({
				room: false,
				isBlockedOrBlocker: false,
				mustJoinWithCode: false,
			});
		}

		const isBlocked = room && room.t === 'd' && subscription && subscription.blocked;
		const isBlocker = room && room.t === 'd' && subscription && subscription.blocker;
		const isBlockedOrBlocker = isBlocked || isBlocker;

		const mustJoinWithCode = !subscription && room.joinCodeRequired;

		return this.state.set({
			room: false,
			isBlockedOrBlocker,
			mustJoinWithCode,
		});
	});

	this.autorun(() => {
		const { rid, tmid, onInputChanged, onResize } = Template.currentData();

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
					tmid,
					getInput: () => input,
				});
			} else {
				this.popupConfig.set(null);
			}

			if (this.autogrow) {
				this.autogrow.destroy();
				this.autogrow = null;
			}

			if (!input) {
				return;
			}

			const shadow = this.find('.js-input-message-shadow');
			this.autogrow = setupAutogrow(input, shadow, onResize);
		});
	});
});

Template.messageBox.onDestroyed(function () {
	if (!this.autogrow) {
		return;
	}

	this.autogrow.destroy();
});

Template.messageBox.helpers({
	isAnonymousOrMustJoinWithCode() {
		const instance = Template.instance();
		const { rid } = Template.currentData();
		if (!rid) {
			return false;
		}
		const isAnonymous = !Meteor.userId();
		return isAnonymous || instance.state.get('mustJoinWithCode');
	},
	isWritable() {
		const { rid, subscription } = Template.currentData();
		if (!rid) {
			return true;
		}

		const isBlockedOrBlocker = Template.instance().state.get('isBlockedOrBlocker');

		if (isBlockedOrBlocker) {
			return false;
		}

		if (subscription?.onHold) {
			return false;
		}

		const isReadOnly = roomCoordinator.readOnly(rid, Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } }));
		const isArchived = roomCoordinator.archived(rid) || (subscription && subscription.t === 'd' && subscription.archived);

		return !isReadOnly && !isArchived;
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
	isSendIconVisible() {
		return Template.instance().isSendIconVisible.get();
	},
	canSend() {
		const { rid } = Template.currentData();
		if (!rid) {
			return true;
		}

		return roomCoordinator.verifyCanSendMessage(rid);
	},
	actions() {
		const actionGroups = messageBox.actions.get();
		return Object.values(actionGroups).reduce((actions, actionGroup) => [...actions, ...actionGroup], []);
	},
	formattingButtons() {
		return formattingButtons.filter(({ condition }) => !condition || condition());
	},
	isBlockedOrBlocker() {
		return Template.instance().state.get('isBlockedOrBlocker');
	},
	onHold() {
		const { rid, subscription } = Template.currentData();
		return rid && !!subscription?.onHold;
	},
	isSubscribed() {
		const { subscription } = Template.currentData();
		return !!subscription;
	},
});

const handleFormattingShortcut = (event, instance) => {
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;
	const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);

	if (!isCmdOrCtrlPressed) {
		return false;
	}

	const key = event.key.toLowerCase();

	const { pattern } = formattingButtons.filter(({ condition }) => !condition || condition()).find(({ command }) => command === key) || {};

	if (!pattern) {
		return false;
	}

	const { input } = instance;
	applyFormatting(pattern, input);
	return true;
};

let sendOnEnter;
let sendOnEnterActive;

Tracker.autorun(() => {
	sendOnEnter = getUserPreference(Meteor.userId(), 'sendOnEnter');
	sendOnEnterActive = sendOnEnter == null || sendOnEnter === 'normal' || (sendOnEnter === 'desktop' && Meteor.Device.isDesktop());
});

const handleSubmit = (event, instance) => {
	const { which: keyCode } = event;

	const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

	if (!isSubmitKey) {
		return false;
	}

	const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
	const isSending = (sendOnEnterActive && !withModifier) || (!sendOnEnterActive && withModifier);

	if (isSending) {
		instance.send(event);
		return true;
	}

	instance.insertNewLine();
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

		EmojiPicker.open(instance.source, (emoji) => {
			const emojiValue = `:${emoji}: `;

			const { input } = instance;

			const caretPos = input.selectionStart;
			const textAreaTxt = input.value;

			input.focus();
			if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
				instance.set(textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos));
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
		const { input, autogrow } = instance;

		setTimeout(() => autogrow && autogrow.update(), 50);

		if (!event.originalEvent.clipboardData) {
			return;
		}

		const items = [...event.originalEvent.clipboardData.items];

		if (items.some(({ kind, type }) => kind === 'string' && type === 'text/plain')) {
			return;
		}

		const files = items
			.filter((item) => item.kind === 'file' && item.type.indexOf('image/') !== -1)
			.map((item) => {
				const fileItem = item.getAsFile();

				const imageExtension = getImageExtensionFromMime(fileItem.type);

				const extension = imageExtension ? `.${imageExtension}` : '';

				return {
					file: fileItem,
					name: `Clipboard - ${moment().format(settings.get('Message_TimeAndDateFormat'))}${extension}`,
				};
			})
			.filter(({ file }) => file !== null);

		if (files.length) {
			event.preventDefault();
			fileUpload(files, input, { rid, tmid });
		}
	},
	'input .js-input-message'(event, instance) {
		const { input } = instance;
		if (!input) {
			return;
		}

		instance.isSendIconVisible.set(!!input.value);

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
		instance.send(event);
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
				prid: this.subscription.prid,
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
					prid: this.subscription.prid,
					event,
				});
			});
	},
	'click .js-format'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const { id } = event.currentTarget.dataset;
		const { pattern } = formattingButtons.filter(({ condition }) => !condition || condition()).find(({ label }) => label === id) || {};

		if (!pattern) {
			return;
		}

		applyFormatting(pattern, instance.input);
	},
});
