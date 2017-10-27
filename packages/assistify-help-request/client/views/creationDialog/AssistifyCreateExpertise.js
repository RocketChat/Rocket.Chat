/* globals AutoComplete, Deps */
import {RocketChat} from 'meteor/rocketchat:lib';
import {FlowRouter} from 'meteor/kadira:flow-router';
import {ReactiveVar} from 'meteor/reactive-var';

const acEvents = {
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown [name="experts"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="experts"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="experts"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="experts"]'(e, t) {
		t.ac.onBlur(e);
	}
};

const validateChannelName = (name) => {
	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		return true;
	}

	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return name.length === 0 || reg.test(name);
};
const filterNames = (old) => {
	if (RocketChat.settings.get('UI_Allow_room_names_with_special_chars')) {
		return old;
	}

	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter(f => reg.test(f)).join('');
};

Template.AssistifyCreateExpertise.helpers({
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
			}
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
	inUse() {
		return Template.instance().inUse.get();
	},
	invalidChannel() {
		const instance = Template.instance();
		const invalid = instance.invalid.get();
		const inUse = instance.inUse.get();
		return invalid || inUse;
	},
	invalidMembers() {
		const instance = Template.instance();
		return instance.invalidMembers.get();
	},
	createIsDisabled() {
		const instance = Template.instance();
		const invalid = instance.invalid.get();
		const inUse = instance.inUse.get();
		const name = instance.name.get();

		if (name.length === 0 || invalid || inUse === true || inUse === undefined) {
			return 'disabled';
		}
		return '';
	},
	iconType() {
		return Template.instance().type.get() === 'p' ? 'lock' : 'hashtag';
	}
});

Template.AssistifyCreateExpertise.events({
	...acEvents,
	'click .rc-tags__tag'({target}, t) {
		const {username} = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'change [name="type"]'(e, t) {
		t.type.set(e.target.checked ? e.target.value : 'd');
	},
	'change [name="readOnly"]'(e, t) {
		t.readOnly.set(e.target.checked);
	},
	'input [name="experts"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	'input [name="expertise"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const modified = filterNames(input.value);

		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.invalid.set(!validateChannelName(input.value));
		if (input.value !== t.name.get()) {
			t.inUse.set(undefined);
			t.checkChannel(input.value);
			t.name.set(modified);
		}
	},
	'submit .create-channel__content'(e, instance) {
		e.preventDefault();
		e.stopPropagation();
		const name = instance.find('input[name="expertise"]').value;

		if (instance.invalid.get() || instance.inUse.get()) {
			return instance.find('input[name="expertise"]').focus();
		}

		Meteor.call('createExpertise', name, instance.selectedUsers.get().map(user => user.username), function(err, result) {
			if (err) {
				if (err.error === 'error-invalid-name') {
					return instance.invalid.set(true);
				}
				if (err.error === 'error-no-members') {
					instance.find('input[name="experts"]').focus();
					return instance.invalidMembers.set(true);
				}
				return;
			}

			return FlowRouter.go('expertise', {name: result.name}, FlowRouter.current().queryParams);
		});
		return false;
	}
});

Template.AssistifyCreateExpertise.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.parentNode.querySelector('[name="expertise"]').focus();
	this.ac.element = this.firstNode.parentNode.querySelector('[name="experts"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});

Template.AssistifyCreateExpertise.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);

	const filter = {exceptions: this.selectedUsers.get().map(u => u.username)};
	// this.onViewRead:??y(function() {
	Deps.autorun(() => {
		filter.exceptions = this.selectedUsers.get().map(u => u.username);
	});

	this.name = new ReactiveVar('');
	this.inUse = new ReactiveVar(undefined);
	this.invalid = new ReactiveVar(false);
	this.invalidMembers = new ReactiveVar(false);
	this.userFilter = new ReactiveVar('');
	this.error = new ReactiveVar(null);

	this.checkChannel = _.debounce((name) => {
		if (validateChannelName(name)) {
			return Meteor.call('roomNameExists', name, (error, result) => {
				if (error) {
					return;
				}
				this.inUse.set(result);
			});
		}
		this.inUse.set(undefined);
	}, 500);

	this.ac = new AutoComplete(
		{
			selector: {
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list'
			},

			limit: 10,
			inputDelay: 300,
			rules: [
				{
					// @TODO maybe change this 'collection' and/or template
					collection: 'UserAndRoom',
					subscription: 'userAutocomplete',
					field: 'username',
					matchAll: true,
					filter,
					doNotChangeWidth: false,
					selector(match) {
						return {term: match};
					},
					sort: 'username'
				}
			]

		});
	this.ac.tmplInst = this;
});
