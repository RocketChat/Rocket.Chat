import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { t, handleError, roomTypes } from 'meteor/rocketchat:utils';
import { Messages, Rooms, Subscriptions } from 'meteor/rocketchat:models';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { settings } from 'meteor/rocketchat:settings';
import _ from 'underscore';
import moment from 'moment';
import toastr from 'toastr';
import mem from 'mem';

const call = (method, ...args) => new Promise((resolve, reject) => {
	Meteor.call(method, ...args, function(err, data) {
		if (err) {
			return reject(err);
		}
		resolve(data);
	});
});

const success = function success(fn) {
	return function(error, result) {
		if (error) {
			return handleError(error);
		}
		if (result) {
			fn.call(this, result);
		}
	};
};

export const MessageAction = new class {
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
			config.condition = mem(config.condition);
		}

		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			btns[config.id] = config;
			return this.buttons.set(btns);
		});
	}

	removeButton(id) {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			delete btns[id];
			return this.buttons.set(btns);
		});
	}

	updateButton(id, config) {
		return Tracker.nonreactive(() => {
			const btns = this.buttons.get();
			if (btns[id]) {
				btns[id] = _.extend(btns[id], config);
				return this.buttons.set(btns);
			}
		});
	}

	getButtonById(id) {
		const allButtons = this.buttons.get();
		return allButtons[id];
	}

	getButtons(message, context, group) {
		let allButtons = _.toArray(this.buttons.get());

		if (group) {
			allButtons = allButtons.filter((button) => button.group === group);
		}

		if (message) {
			allButtons = _.compact(_.map(allButtons, function(button) {
				if (button.context == null || button.context.includes(context)) {
					if (button.condition == null || button.condition(message, context)) {
						return button;
					}
				}
			}));
		}
		return _.sortBy(allButtons, 'order');
	}

	resetButtons() {
		return this.buttons.set({});
	}

	async getPermaLink(msgId) {
		if (!msgId) {
			throw new Error('invalid-parameter');
		}

		const msg = Messages.findOne(msgId) || await call('getSingleMessage', msgId);
		if (!msg) {
			throw new Error('message-not-found');
		}
		const roomData = Rooms.findOne({
			_id: msg.rid,
		});

		if (!roomData) {
			throw new Error('room-not-found');
		}

		const subData = Subscriptions.findOne({ rid: roomData._id, 'u._id': Meteor.userId() });
		const roomURL = roomTypes.getURL(roomData.t, subData || roomData);
		return `${ roomURL }?msg=${ msgId }`;
	}
};

Meteor.startup(async function() {
	const { chatMessages } = await import('meteor/rocketchat:ui');
	MessageAction.addButton({
		id: 'reply-message',
		icon: 'message',
		label: 'Reply',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			const { input } = chatMessages[message.rid];
			$(input)
				.focus()
				.data('mention-user', true)
				.data('reply', message)
				.trigger('dataChange');
		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}

			return true;
		},
		order: 1,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'edit-message',
		icon: 'edit',
		label: 'Edit',
		context: ['message', 'message-mobile'],
		action() {
			const messageId = this._arguments[1]._id;
			chatMessages[Session.get('openedRoom')].edit(document.getElementById(messageId));
		},
		condition(message) {
			if (Subscriptions.findOne({
				rid: message.rid,
			}) == null) {
				return false;
			}
			const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
			const isEditAllowed = settings.get('Message_AllowEditing');
			const editOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isEditAllowed && editOwn))) {
				return;
			}
			const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes');
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
			} else {
				return true;
			}
		},
		order: 2,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'delete-message',
		icon: 'trash',
		label: 'Delete',
		context: ['message', 'message-mobile'],
		color: 'alert',
		action() {
			const message = this._arguments[1];
			chatMessages[Session.get('openedRoom')].confirmDeleteMsg(message);
		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}
			const forceDelete = hasAtLeastOnePermission('force-delete-message', message.rid);
			const hasPermission = hasAtLeastOnePermission('delete-message', message.rid);
			const isDeleteAllowed = settings.get('Message_AllowDeleting');
			const deleteOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isDeleteAllowed && deleteOwn) || forceDelete)) {
				return;
			}
			const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
			if (forceDelete) {
				return true;
			}
			if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
				let msgTs;
				if (message.ts != null) {
					msgTs = moment(message.ts);
				}
				let currentTsDiff;
				if (msgTs != null) {
					currentTsDiff = moment().diff(msgTs, 'minutes');
				}
				return currentTsDiff < blockDeleteInMinutes;
			} else {
				return true;
			}
		},
		order: 3,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'permalink',
		icon: 'permalink',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		async action(event) {
			const message = this._arguments[1];
			const permalink = await MessageAction.getPermaLink(message._id);
			$(event.currentTarget).attr('data-clipboard-text', permalink);
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}

			return true;
		},
		order: 4,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'copy',
		icon: 'copy',
		label: 'Copy',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		action(event) {
			const message = this._arguments[1].msg;
			$(event.currentTarget).attr('data-clipboard-text', message);
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}

			return true;
		},
		order: 5,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'quote-message',
		icon: 'quote',
		label: 'Quote',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			const { input } = chatMessages[message.rid];
			$(input)
				.focus()
				.data('mention-user', false)
				.data('reply', message)
				.trigger('dataChange');
		},
		condition(message) {
			if (Subscriptions.findOne({ rid: message.rid }) == null) {
				return false;
			}

			return true;
		},
		order: 6,
		group: 'menu',
	});


	MessageAction.addButton({
		id: 'ignore-user',
		icon: 'ban',
		label: t('Ignore'),
		context: ['message', 'message-mobile'],
		action() {
			const [, { rid, u: { _id } }] = this._arguments;
			Meteor.call('ignoreUser', { rid, userId:_id, ignore: true }, success(() => toastr.success(t('User_has_been_ignored'))));
		},
		condition(message) {
			const subscription = Subscriptions.findOne({ rid: message.rid });

			return Meteor.userId() !== message.u._id && !(subscription && subscription.ignored && subscription.ignored.indexOf(message.u._id) > -1);
		},
		order: 20,
		group: 'menu',
	});

	MessageAction.addButton({
		id: 'unignore-user',
		icon: 'ban',
		label: t('Unignore'),
		context: ['message', 'message-mobile'],
		action() {
			const [, { rid, u: { _id } }] = this._arguments;
			Meteor.call('ignoreUser', { rid, userId:_id, ignore: false }, success(() => toastr.success(t('User_has_been_unignored'))));

		},
		condition(message) {
			const subscription = Subscriptions.findOne({ rid: message.rid });
			return Meteor.userId() !== message.u._id && subscription && subscription.ignored && subscription.ignored.indexOf(message.u._id) > -1;
		},
		order: 20,
		group: 'menu',
	});


});
