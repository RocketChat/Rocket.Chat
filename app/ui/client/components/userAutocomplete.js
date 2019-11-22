import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { Deps } from 'meteor/deps';

import { AutoComplete } from '../../../meteor-autocomplete/client';
import { settings } from '../../../settings';
import { t } from '../../../utils';
import './userAutocomplete.html';
import './userAutocomplete.css';

const acEvents = {
	'click .autocomplete-list__item'(e, t) {
		t.ac.onItemClick(this, e);
		if (t.data.onUsersChanged) {
			t.data.onUsersChanged(t.selectedUsers);
		}
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

Template.userAutocomplete.helpers({
	field(obj) {
		return obj[Template.instance().data.field];
	},
	disabled() {
		return Template.instance().selectedUsers.get().length === 0;
	},
	tAddUsers() {
		return t('Add_users');
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const instance = Template.instance();
		const filter = instance.userFilter.get();
		const { field } = instance.data;
		return {
			filter,
			template_item: 'autocompleteItemTemplate',
			noMatchTemplate: 'autocompleteEmpty',
			modifier(item) {
				return item[field];
			},
			// modifier(text) {
			// 	const f = filter;
			// 	return `@${ f.length === 0 ? text : text.replace(new RegExp(filter), function(part) {
			// 		return `<strong>${ part }</strong>`;
			// 	}) }`;
			// },
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
});

Template.userAutocomplete.events({
	...acEvents,
	'click .rc-tags__tag'({ target }, t) {
		const field = Blaze.getData(target).user[t.data.field];
		t.selectedUsers.set(t.selectedUsers.get().filter((user) => user[t.data.field] !== field));
		if (t.data.onUsersChanged) {
			t.data.onUsersChanged(t.selectedUsers);
		}
	},
	'click .rc-tags__tag-icon'(e, t) {
		const field = Blaze.getData(t.find('.rc-tags__tag-text')).user[t.data.field];
		t.selectedUsers.set(t.selectedUsers.get().filter((user) => user[t.data.field] !== field));
		if (t.data.onUsersChanged) {
			t.data.onUsersChanged(t.selectedUsers);
		}
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
});

Template.userAutocomplete.onRendered(function() {
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

Template.userAutocomplete.onCreated(function() {
	const { exclude, collection, endpoint, field, selected, id, position } = this.data;
	this.selectedUsers = new ReactiveVar(selected || []);
	const filter = { exceptions: (Array.isArray(exclude) ? exclude : [exclude]).concat(this.selectedUsers.get().map((u) => u._id)) };
	Deps.autorun(() => {
		filter.exceptions = (Array.isArray(exclude) ? exclude : [exclude]).concat(this.selectedUsers.get().map((u) => u._id));
	});
	this.userFilter = new ReactiveVar('');

	this.ac = new AutoComplete({
		selector: {
			anchor: `#${ id } .rc-input__label`,
			item: `#${ id } .autocomplete-list__item`,
			container: `#${ id } .rc-popup-list__list`,
		},
		position: position || 'bottom',
		limit: 10,
		inputDelay: 300,
		rules: [
			{
				// @TODO maybe change this 'collection' and/or template
				collection,
				endpoint,
				field,
				matchAll: true,
				filter,
				doNotChangeWidth: false,
				selector(match) {
					return { name: match, term: match }; // @TODO: should probably be standardized on the server
				},
				sort: 'username',
			},
		],
	});
	this.ac.tmplInst = this;
});
