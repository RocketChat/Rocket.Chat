import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { AutoComplete } from 'meteor/mizzao:autocomplete';
import toastr from 'toastr';
import { t } from '../../utils';
import { settings } from '../../settings';

import './createBroadcast.html';
import { modal } from '../../ui-utils/client';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="users"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="users"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="users"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="users"]'(e, t) {
		t.ac.onBlur(e);
	},
};

const filterNames = (old) => {
	if (settings.get('UI_Allow_room_names_with_special_chars')) {
		return old;
	}

	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
};

Template.createBroadcast.helpers({
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const filter = Template.instance().userFilter;
		return {
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter.get();
				return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			},
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
  	},
	createIsDisabled() {
    	const instance = Template.instance();
		const selectedUsers = instance.selectedUsers.get();
		const reply = instance.reply.get();

		if (reply.length === 0 || selectedUsers.length === 0) {
			return 'disabled';
		}
		return '';
	},
});

Template.createBroadcast.events({
	...acEvents,
	'click .rc-tags__tag'({ target }, t) {
		const { username } = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter((user) => user.username !== username));
	},
	'input #discussion_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	async 'submit #create-discussion, click .js-save-discussion'(event, instance) {
    	event.preventDefault();
    	event.stopPropagation();
    	const users = instance.selectedUsers.get().map(({ username }) => username).filter((value, index, self) => self.indexOf(value) === index);
    	const reply = instance.reply.get();
    	Meteor.call('sendBroadcastMessage', reply, users, function(err, result) {
      		if (err) {
        		toastr.error(err.message);
				return;
    		}
    		if (result) {
        		toastr.success(t('Broadcast_sent'));
        		modal.close();
     		}
    	});
	},
});

Template.createBroadcast.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.querySelector('[name="users"]').focus();
	this.ac.element = this.firstNode.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, { item }) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});

Template.createBroadcast.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);
	const filter = { exceptions :[Meteor.user().username].concat(this.selectedUsers.get().map((u) => u.username)) };
	Tracker.autorun(() => {
		filter.exceptions = [Meteor.user().username].concat(this.selectedUsers.get().map((u) => u.username));
	});
	this.reply = new ReactiveVar('');
	this.userFilter = new ReactiveVar('');
	this.ac = new AutoComplete(
		{
			selector:{
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			position:'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection: 'UserAndRoom',
					subscription: 'userAutocomplete',
					field: 'username',
					matchAll: true,
					filter,
					doNotChangeWidth: false,
					selector(match) {
						return { term: match };
					},
					sort: 'username',
				},
			],
	});
	this.ac.tmplInst = this;
});

