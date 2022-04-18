import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

import { AutoComplete } from '../../../meteor-autocomplete/client';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { ChatRoom } from '../../../models/client';
import { modal } from '../../../ui-utils/client';
import { callWithErrorHandling } from '../../../../client/lib/utils/callWithErrorHandling';

import './invitePlayers.html';

Template.InvitePlayers.helpers({
	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	selectedUsers() {
		const myUsername = Meteor.user().username;
		const { message } = this;
		const users = Template.instance()
			.selectedUsers.get()
			.map((e) => e);
		if (message) {
			users.unshift(message.u);
		}
		return users.filter(({ username }) => myUsername !== username);
	},
	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},
	deleteLastItemRoom() {
		return Template.instance().deleteLastItemRoom;
	},
	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	onSelectRoom() {
		return Template.instance().onSelectRoom;
	},
	roomCollection() {
		return ChatRoom;
	},
	roomSelector() {
		return (expression) => ({ name: { $regex: `.*${expression}.*` } });
	},
	roomModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `#${f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${part}</strong>`)}`;
		};
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${part}</strong>`)}`;
		};
	},
	nameSuggestion() {
		return Template.instance().discussionName.get();
	},
});

Template.InvitePlayers.events({
	async 'submit #invite-players, click .js-invite-players'(e, instance) {
		e.preventDefault();

		const {
			data: { name },
		} = instance;
		const users = instance.selectedUsers.get().map(({ username }) => username);
		const privateGroupName = `${name.replace(/\s/g, '-')}-${Random.id(10)}`;

		try {
			const result = await callWithErrorHandling('createPrivateGroup', privateGroupName, users);

			roomCoordinator.openRouteLink(result.t, result);

			// This ensures the message is only sent after the
			// user has been redirected to the new room, preventing a
			// weird bug that made the message appear as unsent until
			// the screen gets refreshed
			Tracker.autorun((c) => {
				if (Session.get('openedRoom') !== result.rid) {
					return;
				}

				callWithErrorHandling('sendMessage', {
					_id: Random.id(),
					rid: result.rid,
					msg: TAPi18n.__('Apps_Game_Center_Play_Game_Together', { name }),
				});

				c.stop();
			});

			modal.close();
		} catch (err) {
			console.warn(err);
		}
	},
});

Template.InvitePlayers.onCreated(function () {
	this.selectedUsers = new ReactiveVar([]);
	this.onSelectUser = ({ item: user }) => {
		if (user.username === Meteor.user().username) {
			return;
		}
		const users = this.selectedUsers.get();
		if (!users.find((u) => user.username === u.username)) {
			this.selectedUsers.set([...users, user]);
		}
	};
	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	};
});

Template.SearchInvitePlayers.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchInvitePlayers.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown input'(e, t) {
		const KEYCODE_BACKSPACE = 8;
		const KEYCODE_DELETE = 46;

		t.ac.onKeyDown(e);
		if ([KEYCODE_BACKSPACE, KEYCODE_DELETE].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}
	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});
Template.SearchInvitePlayers.onRendered(function () {
	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${name}]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchInvitePlayers.onCreated(function () {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;

	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete({
		selector: {
			anchor: '.rc-input__label',
			item: '.rc-popup-list__item',
			container: '.rc-popup-list__list',
		},
		onSelect,
		position: 'fixed',
		limit: 10,
		inputDelay: 300,
		rules: [
			{
				collection,
				endpoint,
				field,
				matchAll: true,
				doNotChangeWidth: false,
				selector,
				sort,
			},
		],
	});
	this.ac.tmplInst = this;
});
