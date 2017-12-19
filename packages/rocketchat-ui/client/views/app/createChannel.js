import _ from 'underscore';

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
		const extensions_invalid = instance.extensions_invalid.get();
		const inUse = instance.inUse.get();
		const name = instance.name.get();

		if (name.length === 0 || invalid || inUse === true || inUse === undefined || extensions_invalid) {
			return 'disabled';
		}
		return '';
	},
	iconType() {
		return Template.instance().type.get() === 'p' ? 'lock' : 'hashtag';
	},
	tokenAccessEnabled() {
		return RocketChat.settings.get('API_Tokenpass_URL') !== '';
	},
	tokenIsDisabled() {
		return Template.instance().type.get() !== 'p' ? 'disabled' : null;
	},
	tokensRequired() {
		return Template.instance().tokensRequired.get() && Template.instance().type.get() === 'p';
	},
	extensionsConfig() {
		const instance = Template.instance();
		return {
			validations : Template.instance().extensions_validations,
			submits: Template.instance().extensions_submits,
			change: instance.change
		};
	},
	roomTypesBeforeStandard() {
		const orderLow = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'c')[0].order;
		return RocketChat.roomTypes.roomTypesOrder.filter(
			(roomTypeOrder) => roomTypeOrder.order < orderLow
		).map(
			(roomTypeOrder) => {
				return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
			}
		).filter((roomType) => roomType.creationTemplate);
	},
	roomTypesAfterStandard() {
		const orderHigh = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'd')[0].order;
		return RocketChat.roomTypes.roomTypesOrder.filter(
			(roomTypeOrder) => roomTypeOrder.order > orderHigh
		).map(
			(roomTypeOrder) => {
				return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
			}
		).filter((roomType) => roomType.creationTemplate);
	}
});

Template.createChannel.events({
	...acEvents,
	'click .rc-tags__tag'({target}, t) {
		const {username} = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'click .rc-icon'(e, t) {
		const {username} = Blaze.getData(t.find('.rc-tags__tag-text'));
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'change [name=setTokensRequired]'(e, t) {
		t.tokensRequired.set(e.currentTarget.checked);
		t.change();
	},
	'change [name="type"]'(e, t) {
		t.type.set(e.target.checked ? e.target.value : 'd');
		t.change();
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
		if (!Object.keys(instance.extensions_validations).map(key => instance.extensions_validations[key]).reduce((valid, fn) => fn(instance) && valid, true)) {
			return instance.extensions_invalid.set(true);
		}

		const extraData = Object.keys(instance.extensions_submits)
			.reduce((result, key) => {
				return { ...result, ...instance.extensions_submits[key](instance) };
			}, {});

		Meteor.call(isPrivate ? 'createPrivateGroup' : 'createChannel', name, instance.selectedUsers.get().map(user => user.username), readOnly, {}, extraData, function(err, result) {
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
	this.extensions_validations = {};
	this.extensions_submits = {};
	this.name = new ReactiveVar('');
	this.type = new ReactiveVar('p');
	this.readOnly = new ReactiveVar(false);
	this.inUse = new ReactiveVar(undefined);
	this.invalid = new ReactiveVar(false);
	this.extensions_invalid = new ReactiveVar(false);
	this.change = _.debounce(() => {
		let valid = true;
		Object.keys(this.extensions_validations).map(key => this.extensions_validations[key]).forEach(f => (valid = f(this) && valid));
		this.extensions_invalid.set(!valid);
	}, 300);
	this.userFilter = new ReactiveVar('');
	this.tokensRequired = new ReactiveVar(false);
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

Template.tokenpass.onCreated(function() {
	this.data.validations.tokenpass = (instance) => {
		const result = (RocketChat.settings.get('API_Tokenpass_URL') !== '' && instance.tokensRequired.get() && instance.type.get() === 'p') && this.selectedTokens.get().length === 0;
		this.invalid.set(result);
		return !result;
	};
	this.data.submits.tokenpass = () => {
		return {
			tokenpass: {
				require: this.requireAll.get() ? 'all' : 'any',
				tokens: this.selectedTokens.get()
			}
		};
	};
	this.balance = new ReactiveVar('');
	this.token = new ReactiveVar('');
	this.selectedTokens = new ReactiveVar([]);
	this.invalid = new ReactiveVar(false);
	this.requireAll = new ReactiveVar(true);
});

Template.tokenpass.helpers({
	selectedTokens() {
		return Template.instance().selectedTokens.get();
	},
	invalid() {
		return Template.instance().invalid.get();
	},
	addIsDisabled() {
		const {balance, token} = Template.instance();
		return (balance.get().length && token.get().length) ? '' : 'disabled';
	},
	tokenRequiment() {
		return Template.instance().requireAll.get() ? t('Require_all_tokens') : t('Require_any_token');
	},
	tokenRequimentDescription() {
		return Template.instance().requireAll.get() ? t('All_added_tokens_will_be_required_by_the_user') : t('At_least_one_added_token_is_required_by_the_user');
	}
});

Template.tokenpass.events({
	'click [data-button=add]'(e, instance) {
		const {balance, token, selectedTokens} = instance;
		const text = token.get();
		const arr = selectedTokens.get();
		selectedTokens.set([...arr.filter(token => token.token !== text), {token: text, balance: balance.get()}]);
		balance.set('');
		token.set('');
		[...instance.findAll('input[type=text],input[type=number]')].forEach(el => el.value = '');
		instance.data.change();
		return false;
	},
	'click .rc-tags__tag'({target}, t) {
		const {token} = Blaze.getData(target);
		t.selectedTokens.set(t.selectedTokens.get().filter(t => t.token !== token));
		t.data.change();
	},
	'input [name=tokenMinimumNeededBalance]'(e, i) {
		i.balance.set(e.target.value);
	},
	'input [name=tokensRequired]'(e, i) {
		i.token.set(e.target.value);
	},
	'change [name=tokenRequireAll]'(e, i) {
		i.requireAll.set(e.currentTarget.checked);
	}
});
