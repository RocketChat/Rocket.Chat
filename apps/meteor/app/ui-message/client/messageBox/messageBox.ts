import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';
import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import type { ContextType } from 'react';
import { Emitter } from '@rocket.chat/emitter';
import $ from 'jquery';

import { setupAutogrow } from './messageBoxAutogrow';
import { formattingButtons, applyFormatting } from './messageBoxFormatting';
import { EmojiPicker } from '../../../emoji/client';
import { Users, ChatRoom } from '../../../models/client';
import { settings } from '../../../settings/client';
import { UserAction, USER_ACTIVITIES, KonchatNotification } from '../../../ui/client';
import { messageBox, popover } from '../../../ui-utils/client';
import { t, getUserPreference } from '../../../utils/client';
import { getImageExtensionFromMime } from '../../../../lib/getImageExtensionFromMime';
import { keyCodes } from '../../../../client/lib/utils/keyCodes';
import { isRTL } from '../../../../client/lib/utils/isRTL';
import { call } from '../../../../client/lib/utils/call';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import type { ChatContext } from '../../../../client/views/room/contexts/ChatContext';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import './messageBoxActions';
import './messageBoxReplyPreview.ts';
import './userActionIndicator.ts';
import './messageBox.html';

const createComposerAPI = (input: HTMLTextAreaElement, storageID: string): ComposerAPI => {
	const emitter = new Emitter<{ quotedMessagesUpdate: void }>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 1000 })(() => {
		if (input.value) {
			Meteor._localStorage.setItem(storageID, input.value);
			return;
		}

		Meteor._localStorage.removeItem(storageID);
	});

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	input.value = Meteor._localStorage.getItem(storageID) ?? '';
	input.addEventListener('input', persist);

	const release = (): void => {
		input.removeEventListener('input', persist);
	};

	const setText = (
		text: string,
		{
			selection,
		}: {
			selection?:
				| { readonly start?: number; readonly end?: number }
				| ((previous: { readonly start: number; readonly end: number }) => { readonly start?: number; readonly end?: number });
		} = {},
	): void => {
		input.value = text;

		if (typeof selection === 'function') {
			selection = selection({ start: input.selectionStart, end: input.selectionEnd });
		}

		if (selection) {
			input.setSelectionRange(selection.start ?? 0, selection.end ?? text.length);
		}

		persist();
		$(input).trigger('change').trigger('input');
	};

	const clear = (): void => {
		setText('');
	};

	const focus = (): void => {
		input.focus();
	};

	const replyWith = async (text: string): Promise<void> => {
		if (input) {
			input.value = text;
			input.focus();
		}
	};

	const quoteMessage = async (message: IMessage): Promise<void> => {
		_quotedMessages = [..._quotedMessages.filter((_message) => _message._id !== message._id), message];
		notifyQuotedMessagesUpdate();
		input.focus();
	};

	const dismissQuotedMessage = async (mid: IMessage['_id']): Promise<void> => {
		_quotedMessages = _quotedMessages.filter((message) => message._id !== mid);
		notifyQuotedMessagesUpdate();
	};

	const dismissAllQuotedMessages = async (): Promise<void> => {
		_quotedMessages = [];
		notifyQuotedMessagesUpdate();
	};

	const quotedMessages = {
		get: () => _quotedMessages,
		subscribe: (callback: () => void) => emitter.on('quotedMessagesUpdate', callback),
	};

	const setEditingMode = (editing: boolean): void => {
		if (editing) {
			input.parentElement?.classList.add('editing');
		} else {
			input.parentElement?.classList.remove('editing');
		}
	};

	return {
		release,
		get text(): string {
			return input.value;
		},
		get selection(): { start: number; end: number } {
			return {
				start: input.selectionStart,
				end: input.selectionEnd,
			};
		},
		setText,
		clear,
		focus,
		replyWith,
		quoteMessage,
		dismissQuotedMessage,
		dismissAllQuotedMessages,
		quotedMessages,
		setEditingMode,
	};
};

export type MessageBoxTemplateInstance = Blaze.TemplateInstance<{
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	onSend?: (
		event: Event,
		params: {
			value: string;
			tshow?: boolean;
		},
	) => Promise<void>;
	onResize?: () => void;
	onEscape?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onNavigateToNextMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
	tshow?: IMessage['tshow'];
	subscription?: ISubscription;
	showFormattingTips: boolean;
	isEmbedded?: boolean;
	chatContext: ContextType<typeof ChatContext>;
}> & {
	state: ReactiveDict<{
		mustJoinWithCode?: boolean;
		isBlockedOrBlocker?: boolean;
		room?: boolean;
	}>;
	popupConfig: ReactiveVar<{
		rid: string;
		tmid?: string;
		getInput: () => HTMLTextAreaElement;
	} | null>;
	replyMessageData: ReactiveVar<IMessage[] | null>;
	isMicrophoneDenied: ReactiveVar<boolean>;
	isSendIconVisible: ReactiveVar<boolean>;
	input: HTMLTextAreaElement;
	source?: HTMLTextAreaElement;
	autogrow: {
		update: () => void;
		destroy: () => void;
	} | null;
	set: (value: string) => void;
	insertNewLine: () => void;
	send: (event: Event) => void;
	sendIconDisabled: ReactiveVar<boolean>;
};

let lastFocusedInput: HTMLTextAreaElement | undefined = undefined;

export const refocusComposer = () => {
	(lastFocusedInput ?? document.querySelector<HTMLTextAreaElement>('.js-input-message'))?.focus();
};

Template.messageBox.onCreated(function (this: MessageBoxTemplateInstance) {
	this.state = new ReactiveDict();
	this.popupConfig = new ReactiveVar(null);
	this.replyMessageData = new ReactiveVar(this.data.chatContext?.composer?.quotedMessages.get() ?? []);
	this.isMicrophoneDenied = new ReactiveVar(true);
	this.isSendIconVisible = new ReactiveVar(false);

	this.set = (value) => {
		if (!this.input) {
			return;
		}

		this.input.value = value;
		$(this.input).trigger('change').trigger('input');
	};

	this.insertNewLine = () => {
		const { input, autogrow } = this;
		if (!input) {
			return;
		}

		if (input.selectionStart || input.selectionStart === 0) {
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
		autogrow?.update();
	};

	this.send = (event) => {
		const { input } = this;

		if (!input) {
			return;
		}

		const {
			autogrow,
			data: { onSend, tshow },
		} = this;
		const { value } = input;
		this.set('');

		UserAction.stop(this.data.rid, USER_ACTIVITIES.USER_TYPING, { tmid: this.data.tmid });

		onSend?.call(this.data, event, { value, tshow }).then(() => {
			autogrow?.update();
			input.focus();
		});
	};
});

Template.messageBox.onRendered(function (this: MessageBoxTemplateInstance) {
	let inputSetup = false;

	this.autorun(() => {
		const { rid, subscription } = Template.currentData() as MessageBoxTemplateInstance['data'];
		const room = Session.get(`roomData${rid}`);

		if (!inputSetup) {
			const $input = $(this.find('.js-input-message'));
			this.source = $input[0] as HTMLTextAreaElement | undefined;
			if (this.source) {
				inputSetup = true;
			}
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
		const { rid, tmid, onResize, chatContext } = Template.currentData() as MessageBoxTemplateInstance['data'];

		let unsubscribeToQuotedMessages: (() => void) | undefined;

		Tracker.afterFlush(() => {
			const input = this.find('.js-input-message') as HTMLTextAreaElement;

			if (this.input === input) {
				return;
			}

			this.input = input;

			if (chatContext) {
				const storageID = `messagebox_${rid}${tmid ? `-${tmid}` : ''}`;
				const composer = createComposerAPI(input, storageID);
				chatContext.setComposerAPI(composer);
				this.set = composer.setText;
			}

			setTimeout(() => {
				if (window.matchMedia('screen and (min-device-width: 500px)').matches) {
					input.focus();
				}
			}, 200);

			unsubscribeToQuotedMessages?.();

			unsubscribeToQuotedMessages = chatContext?.composer?.quotedMessages.subscribe(() => {
				this.replyMessageData.set(chatContext?.composer?.quotedMessages.get() ?? []);
			});

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

Template.messageBox.onDestroyed(function (this: MessageBoxTemplateInstance) {
	UserAction.cancel(this.data.rid);

	if (lastFocusedInput === this.input) {
		lastFocusedInput = undefined;
	}

	if (!this.autogrow) {
		return;
	}

	this.autogrow.destroy();
});

Template.messageBox.helpers({
	isAnonymousOrMustJoinWithCode() {
		const instance = Template.instance() as MessageBoxTemplateInstance;
		const { rid } = Template.currentData() as MessageBoxTemplateInstance['data'];
		if (!rid) {
			return false;
		}
		const isAnonymous = !Meteor.userId();
		return isAnonymous || instance.state.get('mustJoinWithCode');
	},
	isWritable() {
		const { rid, subscription } = Template.currentData() as MessageBoxTemplateInstance['data'];
		if (!rid) {
			return true;
		}

		const isBlockedOrBlocker = (Template.instance() as MessageBoxTemplateInstance).state.get('isBlockedOrBlocker');

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
		return (Template.instance() as MessageBoxTemplateInstance).popupConfig.get();
	},
	input() {
		return (Template.instance() as MessageBoxTemplateInstance).input;
	},
	replyMessageData() {
		return (Template.instance() as MessageBoxTemplateInstance).replyMessageData.get();
	},
	onDismissReply() {
		const { chatContext } = (Template.instance() as MessageBoxTemplateInstance).data;
		return (mid: IMessage['_id']) => chatContext?.composer?.dismissQuotedMessage(mid);
	},
	isEmojiEnabled() {
		return getUserPreference(Meteor.userId(), 'useEmojis');
	},
	maxMessageLength() {
		return settings.get('Message_AllowConvertLongMessagesToAttachment') ? null : settings.get('Message_MaxAllowedSize');
	},
	isSendIconVisible() {
		return (Template.instance() as MessageBoxTemplateInstance).isSendIconVisible.get();
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
		return (Template.instance() as MessageBoxTemplateInstance).state.get('isBlockedOrBlocker');
	},
	onHold() {
		const { rid, subscription } = Template.currentData();
		return rid && !!subscription?.onHold;
	},
	isSubscribed() {
		const { subscription } = Template.currentData();
		return !!subscription;
	},
	isFederatedRoom() {
		const { rid } = Template.currentData();

		const room = ChatRoom.findOne(rid);

		return room && isRoomFederated(room);
	},
});

const handleFormattingShortcut = (event: KeyboardEvent, instance: MessageBoxTemplateInstance) => {
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
let sendOnEnterActive: boolean | undefined;

Tracker.autorun(() => {
	sendOnEnter = getUserPreference(Meteor.userId(), 'sendOnEnter');
	sendOnEnterActive = sendOnEnter == null || sendOnEnter === 'normal' || (sendOnEnter === 'desktop' && Meteor.Device.isDesktop());
});

const handleSubmit = (event: KeyboardEvent, instance: MessageBoxTemplateInstance) => {
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
	async 'click .js-join'(event: JQuery.ClickEvent) {
		event.stopPropagation();
		event.preventDefault();

		const joinCodeInput = (Template.instance() as MessageBoxTemplateInstance).find('[name=joinCode]') as HTMLInputElement | undefined;
		const joinCode = joinCodeInput?.value;

		await call('joinRoom', this.rid, joinCode);
	},
	'click .js-emoji-picker'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		event.stopPropagation();
		event.preventDefault();

		if (!getUserPreference(Meteor.userId(), 'useEmojis')) {
			return;
		}

		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
			return;
		}

		EmojiPicker.open(instance.source, (emoji: string) => {
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
	'focus .js-input-message'(event: JQuery.FocusEvent) {
		KonchatNotification.removeRoomNotification(this.rid);
		lastFocusedInput = event.currentTarget;
	},
	'keydown .js-input-message'(
		this: MessageBoxTemplateInstance['data'],
		event: JQuery.KeyDownEvent<HTMLTextAreaElement>,
		instance: MessageBoxTemplateInstance,
	) {
		const { originalEvent } = event;
		if (!originalEvent) {
			throw new Error('Event is not an original event');
		}

		const isEventHandled = handleFormattingShortcut(originalEvent, instance) || handleSubmit(originalEvent, instance);

		if (isEventHandled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		const { chatContext } = this;
		const { currentTarget: input } = event;

		switch (event.key) {
			case 'Escape': {
				const currentEditing = chatContext?.currentEditing;

				if (currentEditing) {
					event.preventDefault();
					event.stopPropagation();

					currentEditing.reset().then((reset) => {
						if (!reset) {
							currentEditing?.cancel();
						}
					});

					return;
				}

				if (!input.value.trim()) this.onEscape?.();
				return;
			}

			case 'ArrowUp': {
				if (event.shiftKey) {
					return;
				}

				if (input.selectionEnd === 0) {
					event.preventDefault();
					event.stopPropagation();

					this.onNavigateToPreviousMessage?.();

					if (event.altKey) {
						input.setSelectionRange(0, 0);
					}
				}

				return;
			}

			case 'ArrowDown': {
				if (event.shiftKey) {
					return;
				}

				if (input.selectionEnd === input.value.length) {
					event.preventDefault();
					event.stopPropagation();

					this.onNavigateToNextMessage?.();

					if (event.altKey) {
						input.setSelectionRange(input.value.length, input.value.length);
					}
				}
			}
		}
	},
	'keyup .js-input-message'(this: MessageBoxTemplateInstance['data'], event: JQuery.KeyUpEvent<HTMLTextAreaElement>) {
		const { rid, tmid } = this;
		const { currentTarget: input, which: keyCode } = event;

		if (!Object.values<number>(keyCodes).includes(keyCode)) {
			if (input?.value.trim()) {
				UserAction.start(rid, USER_ACTIVITIES.USER_TYPING, { tmid });
			} else {
				UserAction.stop(rid, USER_ACTIVITIES.USER_TYPING, { tmid });
			}
		}
	},
	'paste .js-input-message'(event: JQuery.TriggeredEvent<HTMLTextAreaElement>, instance: MessageBoxTemplateInstance) {
		const originalEvent = event.originalEvent as ClipboardEvent | undefined;
		if (!originalEvent) {
			throw new Error('Event is not an original event');
		}

		const { autogrow } = instance;

		setTimeout(() => autogrow?.update(), 50);

		if (!originalEvent.clipboardData) {
			return;
		}

		const items = Array.from(originalEvent.clipboardData.items);

		if (items.some(({ kind, type }) => kind === 'string' && type === 'text/plain')) {
			return;
		}

		const files = items
			.filter((item) => item.kind === 'file' && item.type.indexOf('image/') !== -1)
			.map((item) => {
				const fileItem = item.getAsFile();

				if (!fileItem) {
					return;
				}

				const imageExtension = fileItem ? getImageExtensionFromMime(fileItem.type) : undefined;

				const extension = imageExtension ? `.${imageExtension}` : '';

				Object.defineProperty(fileItem, 'name', {
					writable: true,
					value: `Clipboard - ${moment().format(settings.get('Message_TimeAndDateFormat'))}${extension}`,
				});
				return fileItem;
			})
			.filter((file): file is File => !!file);

		if (files.length) {
			event.preventDefault();
			instance.data.onUploadFiles?.(files);
		}
	},
	'input .js-input-message'(
		this: MessageBoxTemplateInstance['data'],
		_event: JQuery.TriggeredEvent<HTMLTextAreaElement>,
		instance: MessageBoxTemplateInstance,
	) {
		const { input } = instance;
		if (!input) {
			return;
		}

		instance.isSendIconVisible.set(!!input.value);

		if (input.value.length > 0) {
			input.dir = isRTL(input.value) ? 'rtl' : 'ltr';
		}
	},
	'propertychange .js-input-message'(
		this: MessageBoxTemplateInstance['data'],
		event: JQuery.TriggeredEvent<HTMLTextAreaElement>,
		instance: MessageBoxTemplateInstance,
	) {
		const originalEvent = event.originalEvent as { propertyName: string } | undefined;
		if (!originalEvent) {
			throw new Error('Event is not an original event');
		}

		if (originalEvent.propertyName !== 'value') {
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
	},
	async 'click .js-send'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		instance.send(event as unknown as Event);
	},
	'click .js-action-menu'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		const groups = messageBox.actions.get();
		const config = {
			popoverClass: 'message-box',
			columns: [
				{
					groups: Object.keys(groups).map((group) => {
						const items = groups[group].map((item) => {
							return {
								icon: item.icon,
								name: t(item.label),
								type: 'messagebox-action',
								id: item.id,
							};
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
				chat: instance.data.chatContext,
			},
			activeElement: event.currentTarget,
		};

		popover.open(config);
	},
	'click .js-message-actions .js-message-action'(
		this: { rid: IRoom['_id']; tmid?: IMessage['_id']; subscription: IRoom },
		event: JQuery.ClickEvent,
		instance: MessageBoxTemplateInstance,
	) {
		const { id } = event.currentTarget.dataset;
		const actions = messageBox.actions.getById(id);
		actions
			.filter(({ action }) => !!action)
			.forEach(({ action }) => {
				console.log(instance.data);
				action.call(null, {
					rid: this.rid,
					tmid: this.tmid,
					messageBox: instance.firstNode as HTMLElement,
					prid: this.subscription.prid,
					event: event as unknown as Event,
					chat: instance.data.chatContext,
				});
			});
	},
	'click .js-format'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		event.preventDefault();
		event.stopPropagation();

		const { id } = event.currentTarget.dataset;
		const { pattern } = formattingButtons.filter(({ condition }) => !condition || condition()).find(({ label }) => label === id) ?? {};

		if (!pattern) {
			return;
		}

		applyFormatting(pattern, instance.input);
	},
});
