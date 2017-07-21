import moment from 'moment';

import toastr from 'toastr';

RocketChat.MessageAction = new class {
	/*
  	config expects the following keys (only id is mandatory):
  		id (mandatory)
  		icon: string
  		i18nLabel: string
  		action: function(event, instance)
  		validation: function(message)
  		order: integer
   */

	constructor() {
		this.buttons = new ReactiveVar({});
	}

	addButton(config) {
		if (!config || !config.id) {
			return false;
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

	getButtons(message, context) {
		const allButtons = _.toArray(this.buttons.get());
		let allowedButtons = allButtons;
		if (message) {
			allowedButtons = _.compact(_.map(allButtons, function(button) {
				if (button.context == null || button.context.includes(context)) {
					if (button.validation == null || button.validation(message, context)) {
						return button;
					}
				}
			}));
		}
		return _.sortBy(allowedButtons, 'order');
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

	hideDropDown() {
		return $('.message-dropdown:visible').hide();
	}
};

Meteor.startup(function() {
	$(document).click((event) => {
		const target = $(event.target);
		if (!target.closest('.message-cog-container').length && !target.is('.message-cog-container')) {
			return RocketChat.MessageAction.hideDropDown();
		}
	});

	RocketChat.MessageAction.addButton({
		id: 'reply-message',
		icon: 'icon-reply',
		i18nLabel: 'Reply',
		context: ['message', 'message-mobile'],
		action(event, instance) {
			const message = this._arguments[1];
			const input = instance.find('.input-message');
			const url = RocketChat.MessageAction.getPermaLink(message._id);
			const roomInfo = RocketChat.models.Rooms.findOne(message.rid, { fields: { t: 1 } });
			let text = `[ ](${ url }) `;

			if (roomInfo.t !== 'd' && message.u.username !== Meteor.user().username) {
				text += `@${ message.u.username } `;
			}

			if (input.value) {
				input.value += input.value.endsWith(' ') ? '' : ' ';
			}
			input.value += text;
			input.focus();
			return RocketChat.MessageAction.hideDropDown();
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({
				rid: message.rid
			}) == null) {
				return false;
			}
			return true;
		},
		order: 1
	});
	/* globals chatMessages*/
	RocketChat.MessageAction.addButton({
		id: 'edit-message',
		icon: 'icon-pencil',
		i18nLabel: 'Edit',
		context: ['message', 'message-mobile'],
		action(e, instance) {
			const message = $(e.currentTarget).closest('.message')[0];
			chatMessages[Session.get('openedRoom')].edit(message);
			RocketChat.MessageAction.hideDropDown();
			const input = instance.find('.input-message');
			Meteor.setTimeout(() => {
				input.focus();
				input.updateAutogrow();
			}, 200);
		},
		validation(message) {
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
		order: 2
	});
	RocketChat.MessageAction.addButton({
		id: 'delete-message',
		icon: 'icon-trash-alt',
		i18nLabel: 'Delete',
		context: ['message', 'message-mobile'],
		action() {
			const message = this._arguments[1];
			RocketChat.MessageAction.hideDropDown();
			return chatMessages[Session.get('openedRoom')].confirmDeleteMsg(message);
		},
		validation(message) {
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
		order: 3
	});
	/* globals cordova*/
	RocketChat.MessageAction.addButton({
		id: 'permalink',
		icon: 'icon-link',
		i18nLabel: 'Permalink',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		action(event) {
			const message = this._arguments[1];
			const permalink = RocketChat.MessageAction.getPermaLink(message._id);
			RocketChat.MessageAction.hideDropDown();
			if (Meteor.isCordova) {
				cordova.plugins.clipboard.copy(permalink);
			} else {
				$(event.currentTarget).attr('data-clipboard-text', permalink);
			}
			return toastr.success(TAPi18n.__('Copied'));
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({
				rid: message.rid
			}) == null) {
				return false;
			}
			return true;
		},
		order: 4
	});
	RocketChat.MessageAction.addButton({
		id: 'copy',
		icon: 'icon-paste',
		i18nLabel: 'Copy',
		classes: 'clipboard',
		context: ['message', 'message-mobile'],
		action(event) {
			const message = this._arguments[1].msg;
			RocketChat.MessageAction.hideDropDown();
			if (Meteor.isCordova) {
				cordova.plugins.clipboard.copy(message);
			} else {
				$(event.currentTarget).attr('data-clipboard-text', message);
			}
			return toastr.success(TAPi18n.__('Copied'));
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({
				rid: message.rid
			}) == null) {
				return false;
			}
			return true;
		},
		order: 5
	});
	return RocketChat.MessageAction.addButton({
		id: 'quote-message',
		icon: 'icon-quote-left',
		i18nLabel: 'Quote',
		context: ['message', 'message-mobile'],
		action(event, instance) {
			const message = this._arguments[1];
			const input = instance.find('.input-message');
			const url = RocketChat.MessageAction.getPermaLink(message._id);
			const text = `[ ](${ url }) `;
			if (input.value) {
				input.value += input.value.endsWith(' ') ? '' : ' ';
			}
			input.value += text;
			input.focus();
			return RocketChat.MessageAction.hideDropDown();
		},
		validation(message) {
			if (RocketChat.models.Subscriptions.findOne({
				rid: message.rid
			}) == null) {
				return false;
			}
			return true;
		},
		order: 6
	});
});
