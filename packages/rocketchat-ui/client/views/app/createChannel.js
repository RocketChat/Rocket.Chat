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

Template.createChannel.helpers({
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac): param;
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
	typeLabel() {
		return t(Template.instance().type.get() === 'p' ? t('Private_Channel') : t('Public_Channel'));
	},
	typeDescription() {
		return t(Template.instance().type.get() === 'p' ? t('Just_invited_people_can_access_this_channel') : t('Everyone_can_access_this_channel'));
	},
	readOnlyDescription() {
		return t(Template.instance().readOnly.get() ? t('Only_authorized_users_can_write_new_messages') : t('All_users_in_the_channel_can_write_new_messages'));
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

Template.createChannel.events({
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
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const length = input.value.length;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	'input [name="name"]'(e, t) {
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
		const name = e.target.name.value;
		const type = instance.type.get();
		const readOnly = instance.readOnly.get();
		const isPrivate = type === 'p';

		if (instance.invalid.get() || instance.inUse.get()) {
			return e.target.name.focus();
		}

		Meteor.call(isPrivate ? 'createPrivateGroup' : 'createChannel', name, instance.selectedUsers.get().map(user => user.username), readOnly, function(err, result) {
			if (err) {
				if (err.error === 'error-invalid-name') {
					return instance.invalid.set(true);
				}
				if (err.error === 'error-duplicate-channel-name') {
					return instance.inUse.set(true);
				}
				return;
			}

			if (!isPrivate) {
				RocketChat.callbacks.run('aftercreateCombined', { _id: result.rid, name: result.name });
			}

			return FlowRouter.go(isPrivate ? 'group' : 'channel', { name: result.name }, FlowRouter.current().queryParams);
		});
		return false;
	}
});

Template.createChannel.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.querySelector('[name="name"]').focus();
	this.ac.element = this.firstNode.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});
/* global AutoComplete Deps */
Template.createChannel.onCreated(function() {
	this.selectedUsers = new ReactiveVar([]);

	const filter = {exceptions :[Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username))};
	// this.onViewRead:??y(function() {
	Deps.autorun(() => {
		filter.exceptions = [Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username));
	});

	this.name = new ReactiveVar('');
	this.type = new ReactiveVar('p');
	this.readOnly = new ReactiveVar(false);
	this.inUse = new ReactiveVar(undefined);
	this.invalid = new ReactiveVar(false);
	this.userFilter = new ReactiveVar('');
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
	}, 1000);

	this.ac = new AutoComplete(
		{
			selector:{
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
						return { term: match };
					},
					sort: 'username'
				}
			]

		});

	// this.firstNode.querySelector('[name=name]').focus();
	// this.ac.element = this.firstNode.querySelector('[name=users]');
	// this.ac.$element = $(this.ac.element);
	this.ac.tmplInst = this;
});
