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
import tinykeys from 'tinykeys';

import { setupAutogrow } from './messageBoxAutogrow';
import { getFormattingButtons, applyFormattingFromEvent } from './messageBoxFormatting';
import { Users, ChatRoom } from '../../../models/client';
import { settings } from '../../../settings/client';
import { fileUpload, KonchatNotification } from '../../../ui/client';
import { messageBox, popover } from '../../../ui-utils/client';
import { t, getUserPreference } from '../../../utils/client';
import { getImageExtensionFromMime } from '../../../../lib/getImageExtensionFromMime';
import { isRTL } from '../../../../client/lib/utils/isRTL';
import { call } from '../../../../client/lib/utils/call';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import './messageBoxActions';
import './messageBoxReplyPreview.ts';
import './messageBox.html';
import { messageBoxOnEnter } from './messageBoxOnEnter';

export type MessageboxPropTypes = {
	rid: IRoom['_id'];
	tmid: IMessage['_id'];
	showFormattingTips: boolean;

	onSend: (
		event: Event,
		params: {
			// rid: string;
			// tmid?: string;
			value: string;
			// tshow?: boolean;
		},
		done?: () => void,
	) => void;

	onInputChanged: (input: HTMLTextAreaElement) => void;
	tshow: IMessage['tshow'];
	subscription: ISubscription & IRoom;

	onKeyDown: (event: KeyboardEvent) => void;
	onKeyUp: (event: KeyboardEvent) => void;
	sendOnEnter: 'normal' | 'desktop';
	openEmojiPicker: (event: Event, input: HTMLTextAreaElement) => void;
	useEmojis: boolean;
};

type MessageBoxTemplateInstance = Blaze.TemplateInstance<MessageboxPropTypes> & {
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
	stopComposerShortcut: () => void;
	stopComposerEnter: () => void;
	sendIconDisabled: ReactiveVar<boolean>;
};

Template.messageBox.onCreated(function (this: MessageBoxTemplateInstance) {
	this.state = new ReactiveDict();
	this.popupConfig = new ReactiveVar(null);
	this.replyMessageData = new ReactiveVar(null);
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
		const { input, autogrow, onNewLine } = this;

		if (!input) {
			return;
		}

		onNewLine();

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
			data: { rid, tmid, onSend, tshow },
		} = this;
		const { value } = input;
		this.set('');

		if (!onSend) {
			return;
		}

		onSend.call(this.data, event, { rid, tmid, value, tshow }, () => {
			autogrow?.update();
			input.focus();
		});
	};
});

let sendOnEnter;
let sendOnEnterActive: boolean;

Tracker.autorun(() => {
	sendOnEnter = getUserPreference(Meteor.userId(), 'sendOnEnter');
	sendOnEnterActive = Boolean(sendOnEnter == null || sendOnEnter === 'normal' || (sendOnEnter === 'desktop' && Meteor.Device.isDesktop()));
});
Template.messageBox.onRendered(function (this: MessageBoxTemplateInstance) {
	let inputSetup = false;

	const setupEnter = () => {
		this.stopComposerEnter?.();
		this.stopComposerEnter = messageBoxOnEnter(sendOnEnterActive, this.input, (e) => {
			this.send(e as unknown as Event);
		});
	};

	const setupShortcuts = () => {
		this.stopComposerShortcut?.();

		this.stopComposerShortcut = tinykeys(this.input, {
			...getFormattingButtons().reduce((config, button) => {
				if (!button.command) {
					return config;
				}
				config[button.command] = (e) => {
					if (!button.pattern) {
						return;
					}
					applyFormattingFromEvent(e, button.pattern, this.input);
				};

				return config;
			}, {} as Record<string, (e: KeyboardEvent) => void>),
		});
	};

	this.autorun(() => {
		const { rid, subscription } = Template.currentData() as MessageBoxTemplateInstance['data'];
		const room = Session.get(`roomData${rid}`);

		if (!inputSetup) {
			const $input = $(this.find('.js-input-message'));
			this.source = $input[0] as HTMLTextAreaElement | undefined;
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
			const input = this.find('.js-input-message') as HTMLTextAreaElement;

			if (this.input === input) {
				return;
			}

			this.input = input;
			onInputChanged?.(input);

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

			setupShortcuts();
			setupEnter();
			const shadow = this.find('.js-input-message-shadow');
			this.autogrow = setupAutogrow(input, shadow, onResize);
		});
	});
});

Template.messageBox.onDestroyed(function (this: MessageBoxTemplateInstance) {
	this.stopComposerShortcut?.();
	this.stopComposerEnter?.();
	this.autogrow?.destroy();
});

Template.messageBox.helpers({
	isAnonymousOrMustJoinWithCode() {
		const instance = Template.instance() as MessageBoxTemplateInstance;
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
		return getFormattingButtons();
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

Template.messageBox.events({
	async 'click .js-join'(event: JQuery.ClickEvent) {
		event.stopPropagation();
		event.preventDefault();

		const joinCodeInput = (Template.instance() as MessageBoxTemplateInstance).find('[name=joinCode]') as HTMLInputElement | undefined;
		const joinCode = joinCodeInput?.value;

		await call('joinRoom', this.rid, joinCode);
	},
	'click .js-emoji-picker'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		this.openEmojiPicker(event, instance.input);
	},
	'focus .js-input-message'() {
		KonchatNotification.removeRoomNotification(this.rid);
	},
	'keydown .js-input-message'(event: JQuery.KeyDownEvent) {
		const { originalEvent } = event;
		if (!originalEvent) {
			throw new Error('Event is not an original event');
		}

		const { onKeyDown } = this;
		onKeyDown?.call(this, event);
	},
	'keyup .js-input-message'(event: JQuery.KeyUpEvent) {
		const { rid, tmid, onKeyUp } = this;
		onKeyUp?.call(this, event, { rid, tmid });
	},
	'paste .js-input-message'(event: JQuery.TriggeredEvent, instance: MessageBoxTemplateInstance) {
		const originalEvent = event.originalEvent as ClipboardEvent | undefined;
		if (!originalEvent) {
			throw new Error('Event is not an original event');
		}

		const { rid, tmid } = this;
		const { input, autogrow } = instance;

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

				return {
					file: fileItem,
					name: `Clipboard - ${moment().format(settings.get('Message_TimeAndDateFormat'))}${extension}`,
				};
			})
			.filter(
				(
					file,
				): file is {
					file: File;
					name: string;
				} => Boolean(file),
			);

		if (files.length) {
			event.preventDefault();
			fileUpload(files, input, { rid, tmid });
		}
	},
	'input .js-input-message'(event: JQuery.TriggeredEvent, instance: MessageBoxTemplateInstance) {
		const { input } = instance;
		if (!input) {
			return;
		}

		instance.isSendIconVisible.set(!!input.value);

		if (input.value.length > 0) {
			input.dir = isRTL(input.value) ? 'rtl' : 'ltr';
		}

		const { rid, tmid, onValueChanged } = this;
		onValueChanged?.call(this, event, { rid, tmid });
	},
	'propertychange .js-input-message'(event: JQuery.TriggeredEvent, instance: MessageBoxTemplateInstance) {
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

		const { rid, tmid, onValueChanged } = this;
		onValueChanged?.call(this, event, { rid, tmid });
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
				action.call(null, {
					rid: this.rid,
					tmid: this.tmid,
					messageBox: instance.firstNode as HTMLElement,
					prid: this.subscription.prid,
					event: event as unknown as Event,
				});
			});
	},
	'click .js-format'(event: JQuery.ClickEvent, instance: MessageBoxTemplateInstance) {
		const { id } = event.currentTarget.dataset;
		const { pattern } = getFormattingButtons().find(({ label }) => label === id) ?? {};

		if (!pattern) {
			return;
		}

		applyFormattingFromEvent(event as unknown as Event, pattern, instance.input);
	},
});
