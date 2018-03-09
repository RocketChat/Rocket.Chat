/* globals chatMessages cordova */

import _ from 'underscore';
import moment from 'moment';
import toastr from 'toastr';

RocketChat.MessageAction = new class {
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
			allButtons = allButtons.filter(button => button.group === group);
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

	getPermaLink(msgId) {
		const roomData = ChatSubscription.findOne({
			rid: Session.get('openedRoom')
		});
		let routePath = document.location.pathname;
		if (roomData) {
			routePath = RocketChat.roomTypes.getRouteLink(roomData.t, roomData);
		}
		return `${ Meteor.absoluteUrl().replace(/\/$/, '') + routePath }?msg=${ msgId }`;
	}
};

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'reply-message',
		icon: 'message',
		label: 'Reply',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			const {input} = chatMessages[message.rid];
			const url = RocketChat.MessageAction.getPermaLink(message._id);
			const roomInfo = RocketChat.models.Rooms.findOne(message.rid, { fields: { t: 1 } });
			let text = `[ ](${ url }) `;
			let inputValue = '';
			$('.rc-message-box__textarea')
				.data('reply', message)
				.trigger('dataChange');
			if (roomInfo.t !== 'd' && message.u.username !== Meteor.user().username) {
				text += `@${ message.u.username } `;
			}

			if (input.value && !input.value.endsWith(' ')) {
				inputValue += ' ';
			}
			inputValue += text;

			$(input)
				.focus()
				.val(inputValue)
				.trigger('change')
				.trigger('input');
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}

			return true;
		},
		order: 1,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'edit-message',
		icon: 'edit',
		label: 'Edit',
		context: ['message', 'message-mobile'],
		action() {
			const messageId = this._arguments[1]._id;
			chatMessages[Session.get('openedRoom')].edit(document.getElementById(messageId));
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({
				rid: message.rid
			}) == null) {
				return false;
			}
			const hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid);
			const isEditAllowed = RocketChat.settings.get('Message_AllowEditing');
			const editOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isEditAllowed && editOwn))) {
				return;
			}
			const blockEditInMinutes = RocketChat.settings.get('Message_AllowEditing_BlockEditInMinutes');
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
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
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
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}
			const forceDelete = RocketChat.authz.hasAtLeastOnePermission('force-delete-message', message.rid);
			const hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid);
			const isDeleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
			const deleteOwn = message.u && message.u._id === Meteor.userId();
			if (!(hasPermission || (isDeleteAllowed && deleteOwn) || forceDelete)) {
				return;
			}
			const blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
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
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'permalink',
		icon: 'permalink',
		label: 'Permalink',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		action(event) {
			const message = this._arguments[1];
			const permalink = RocketChat.MessageAction.getPermaLink(message._id);
			if (Meteor.isCordova) {
				cordova.plugins.clipboard.copy(permalink);
			} else {
				$(event.currentTarget).attr('data-clipboard-text', permalink);
			}
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}

			return true;
		},
		order: 4,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'copy',
		icon: 'copy',
		label: 'Copy',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		action(event) {
			const message = this._arguments[1].msg;
			if (Meteor.isCordova) {
				cordova.plugins.clipboard.copy(message);
			} else {
				$(event.currentTarget).attr('data-clipboard-text', message);
			}
			toastr.success(TAPi18n.__('Copied'));
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}

			return true;
		},
		order: 5,
		group: 'menu'
	});

	RocketChat.MessageAction.addButton({
		id: 'quote-message',
		icon: 'quote',
		label: 'Quote',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			const {input} = chatMessages[message.rid];
			const url = RocketChat.MessageAction.getPermaLink(message._id);
			const text = `[ ](${ url }) `;
			if (input.value) {
				input.value += input.value.endsWith(' ') ? '' : ' ';
			}
			input.value += text;
			input.focus();
			$(input).trigger('change').trigger('input');
		},
		condition(message) {
			if (RocketChat.models.Subscriptions.findOne({rid: message.rid}) == null) {
				return false;
			}

			return true;
		},
		order: 6,
		group: 'menu'
	});
});
