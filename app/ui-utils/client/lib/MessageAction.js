import _ from 'underscore';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

import { messageArgs } from './messageArgs';
import { roomTypes } from '../../../utils/client';
import { Messages, Rooms, Subscriptions } from '../../../models/client';
import { hasAtLeastOnePermission, hasPermission } from '../../../authorization/client';
import { modal } from './modal';
import { imperativeModal } from '../../../../client/lib/imperativeModal';
import ReactionList from '../../../../client/views/room/modals/ReactionListModal';
import { call } from '../../../../client/lib/utils/call';
import { canDeleteMessage } from '../../../../client/lib/utils/canDeleteMessage';
import { dispatchToastMessage } from '../../../../client/lib/toast';

export const addMessageToList = (messagesList, message) => {
	// checks if the message is not already on the list
	if (!messagesList.find(({ _id }) => _id === message._id)) {
		messagesList.push(message);
	}

	return messagesList;
};

export const MessageAction = new (class {
	/*
  	config expects the following keys (only id is mandatory):
  		id (mandatory)
  		icon: string
  		label: string
  		action: function(event, instance)
  		condition: function(message)
			order: integer
			group: string (message or menu)
   */

	constructor() {
		this.buttons = new ReactiveVar({});
	}

	addButton(config) {
		if (!config || !config.id) {
			return false;
		}

		if (!config.group) {
			config.group = 'menu';
		}

		if (config.condition) {
			config.condition = mem(config.condition, { maxAge: 1000, cacheKey: JSON.stringify });
		}

		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			btns[config.id] = config;
			mem.clear(this._getButtons);
			mem.clear(this._getButtonsByGroup);
			return this.buttons.set(btns);
		});
	}

	removeButton(id) {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			delete btns[id];
			mem.clear(this._getButtons);
			mem.clear(this._getButtonsByGroup);
			return this.buttons.set(btns);
		});
	}

	updateButton(id, config) {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			if (btns[id]) {
				btns[id] = _.extend(btns[id], config);
				mem.clear(this._getButtons);
				mem.clear(this._getButtonsByGroup);
				return this.buttons.set(btns);
			}
		});
	}

	getButtonById(id) {
		const allButtons = this.buttons.get();
		return allButtons[id];
	}

	_getButtons = mem(function () {
		return _.sortBy(_.toArray(this.buttons.get()), 'order');
	});

	_getButtonsByGroup = mem(function (group) {
		return this._getButtons().filter((button) => (Array.isArray(button.group) ? button.group.includes(group) : button.group === group));
	});

	getButtons(message, context, group) {
		const allButtons = group ? this._getButtonsByGroup(group) : this._getButtons();

		if (message) {
			return allButtons.filter(function (button) {
				if (button.context == null || button.context.includes(context)) {
					return button.condition == null || button.condition(message, context);
				}
				return false;
			});
		}
		return allButtons;
	}

	resetButtons() {
		mem.clear(this._getButtons);
		mem.clear(this._getButtonsByGroup);
		return this.buttons.set({});
	}

	async getPermaLink(msgId) {
		if (!msgId) {
			throw new Error('invalid-parameter');
		}

		const msg = Messages.findOne(msgId) || (await call('getSingleMessage', msgId));
		if (!msg) {
			throw new Error('message-not-found');
		}
		const roomData = Rooms.findOne({
			_id: msg.rid,
		});

		if (!roomData) {
			throw new Error('room-not-found');
		}

		const subData = Subscriptions.findOne({ 'rid': roomData._id, 'u._id': Meteor.userId() });
		const roomURL = roomTypes.getURL(roomData.t, subData || roomData);
		return `${roomURL}?msg=${msgId}`;
	}
})();

Meteor.startup(async function () {
	const { chatMessages } = await import('../../../ui');

	const getChatMessagesFrom = (msg) => {
		const { rid = Session.get('openedRoom'), tmid = msg._id } = msg;

		return chatMessages[`${rid}-${tmid}`] || chatMessages[rid];
	};

	MessageAction.addButton({
		id: 'reply-directly',
		icon: 'reply-directly',
		label: 'Reply_in_direct_message',
		context: ['message', 'message-mobile', 'threads'],
		action() {
			const { msg } = messageArgs(this);
			roomTypes.openRouteLink(
				'd',
				{ name: msg.u.username },
				{
					...FlowRouter.current().queryParams,
					reply: msg._id,
				},
			);
		},
		condition({ subscription, room, msg, u }) {
			if (subscription == null) {
				return false;
			}
			if (room.t === 'd' || room.t === 'l') {
				return false;
			}

			// Check if we already have a DM started with the message user (not ourselves) or we can start one
			if (u._id !== msg.u._id && !hasPermission('create-d')) {
				const dmRoom = Rooms.findOne({ _id: [u._id, msg.u._id].sort().join('') });
				if (!dmRoom || !Subscriptions.findOne({ 'rid': dmRoom._id, 'u._id': u._id })) {
					return false;
				}
			}

			return true;
		},
		order: 0,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'quote-message',
		icon: 'quote',
		label: 'Quote',
		context: ['message', 'message-mobile', 'threads'],
		action() {
			const { msg: message } = messageArgs(this);
			const { input } = getChatMessagesFrom(message);
			const $input = $(input);

			let messages = $input.data('reply') || [];

			messages = addMessageToList(messages, message, input);

			$input.focus().data('mention-user', false).data('reply', messages).trigger('dataChange');
		},
		condition({ subscription, room }) {
			if (subscription == null) {
				return false;
			}
			const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return true;
		},
		order: -3,
		group: ['message', 'menu'],
	});

	MessageAction.addButton({
		id: 'permalink',
		icon: 'permalink',
		label: 'Get_link',
		classes: 'clipboard',
		context: ['message', 'message-mobile', 'threads'],
		async action() {
			const { msg: message } = messageArgs(this);
			const permalink = await MessageAction.getPermaLink(message._id);
			navigator.clipboard.writeText(permalink);
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Copied') });
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 4,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'copy',
		icon: 'copy',
		label: 'Copy',
		classes: 'clipboard',
		context: ['message', 'message-mobile', 'threads'],
		action() {
			const {
				msg: { msg },
			} = messageArgs(this);
			navigator.clipboard.writeText(msg);
			dispatchToastMessage({ type: 'success', message: TAPi18n.__('Copied') });
		},
		condition({ subscription }) {
			return !!subscription;
		},
		order: 5,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'edit-message',
		icon: 'edit',
		label: 'Edit',
		context: ['message', 'message-mobile', 'threads'],
		action() {
			const { msg } = messageArgs(this);
			getChatMessagesFrom(msg).edit(document.getElementById(msg.tmid ? `thread-${msg._id}` : msg._id));
		},
		condition({ msg: message, subscription, settings }) {
			if (subscription == null) {
				return false;
			}
			const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
			const isEditAllowed = settings.Message_AllowEditing;
			const editOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isEditAllowed && editOwn))) {
				return;
			}
			const blockEditInMinutes = settings.Message_AllowEditing_BlockEditInMinutes;
			if (blockEditInMinutes) {
				let msgTs;
				if (message.ts != null) {
					msgTs = moment(message.ts);
				}
				let currentTsDiff;
				if (msgTs != null) {
					currentTsDiff = moment().diff(msgTs, 'minutes');
				}
				return currentTsDiff < blockEditInMinutes;
			}
			return true;
		},
		order: 6,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'delete-message',
		icon: 'trash',
		label: 'Delete',
		context: ['message', 'message-mobile', 'threads'],
		color: 'alert',
		action() {
			const { msg } = messageArgs(this);
			getChatMessagesFrom(msg).confirmDeleteMsg(msg);
		},
		condition({ msg: message, subscription, room }) {
			if (!subscription) {
				return false;
			}
			const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return canDeleteMessage({
				rid: message.rid,
				ts: message.ts,
				uid: message.u._id,
			});
		},
		order: 18,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'report-message',
		icon: 'report',
		label: 'Report',
		context: ['message', 'message-mobile', 'threads'],
		color: 'alert',
		action() {
			const { msg: message } = messageArgs(this);
			modal.open(
				{
					title: TAPi18n.__('Report_this_message_question_mark'),
					text: message.msg,
					inputPlaceholder: TAPi18n.__('Why_do_you_want_to_report_question_mark'),
					type: 'input',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: TAPi18n.__('Report_exclamation_mark'),
					cancelButtonText: TAPi18n.__('Cancel'),
					closeOnConfirm: false,
					html: false,
				},
				(inputValue) => {
					if (inputValue === false) {
						return false;
					}

					if (!inputValue.trim()) {
						modal.showInputError(TAPi18n.__('You_need_to_write_something'));
						return false;
					}

					Meteor.call('reportMessage', message._id, inputValue);

					modal.open({
						title: TAPi18n.__('Report_sent'),
						text: TAPi18n.__('Thank_you_exclamation_mark'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false,
					});
				},
			);
		},
		condition({ subscription, room }) {
			const isLivechatRoom = roomTypes.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}
			return Boolean(subscription);
		},
		order: 17,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'reaction-list',
		icon: 'emoji',
		label: 'Reactions',
		context: ['message', 'message-mobile', 'threads'],
		action(_, { tabBar, rid }) {
			const {
				msg: { reactions },
			} = messageArgs(this);

			imperativeModal.open({
				component: ReactionList,
				props: { reactions, rid, tabBar, onClose: imperativeModal.close },
			});
		},
		condition({ msg: { reactions } }) {
			return !!reactions;
		},
		order: 18,
		group: 'menu',
	});
});
