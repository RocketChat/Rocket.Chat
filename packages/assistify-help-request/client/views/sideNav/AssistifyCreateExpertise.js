/* globals RocketChat, FlowRouter, console */
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

	this.find('input[name="expertise"]').focus();
	this.ac.element = this.find('input[name="experts"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});
/* global AutoComplete Deps */
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

// Template.AssistifyAssistifyCreateExpertise.helpers({
// 	selectedUsers() {
// 		const instance = Template.instance();
// 		return instance.selectedUsers.get();
// 	},
// 	autocompleteSettings() {
// 		return {
// 			limit: 10,
// 			// inputDelay: 300
// 			rules: [
// 				{
// 					// @TODO maybe change this 'collection' and/or template
// 					collection: 'UserAndRoom',
// 					subscription: 'userAutocomplete',
// 					field: 'username',
// 					template: Template.userSearch,
// 					noMatchTemplate: Template.userSearchEmpty,
// 					matchAll: true,
// 					filter: {
// 						exceptions: Template.instance().selectedUsers.get()
// 					},
// 					selector(match) {
// 						return {term: match};
// 					},
// 					sort: 'username'
// 				}
// 			]
// 		};
// 	},
// 	canAssistifyCreateExpertise() {
// 		// as custom authorization leads to a streamer-exception, it has been disabled.
// 		// Check whether the user is in the expert's channel as lightweight workaround
// 		const instance = Template.instance();
// 		const isExpert = instance.isExpert.get();
// 		const error = instance.error.get();
// 		if (!isExpert && error && error.error === 'no-expert-room-defined') {
// 			toastr.info(TAPi18n.__('no-expert-room-defined'));
// 			return false;
// 		}
// 		return isExpert;
// 	}
// });
//
// Template.AssistifyAssistifyCreateExpertise.events({
// 	'autocompleteselect #experts'(event, instance, doc) {
// 		instance.selectedUsers.set(instance.selectedUsers.get().concat(doc.username));
//
// 		instance.selectedUserNames[doc.username] = doc.name;
//
// 		event.currentTarget.value = '';
// 		return event.currentTarget.focus();
// 	},
//
// 	'click .remove-expert'(e, instance) {
// 		const self = this;
//
// 		let users = instance.selectedUsers.get();
// 		users = _.reject(instance.selectedUsers.get(), _id => _id === self.valueOf());
//
// 		instance.selectedUsers.set(users);
//
// 		return $('#experts').focus();
// 	},
//
//
// 	'keyup #expertise'(e, instance) {
// 		if (e.keyCode === 13) {
// 			instance.$('#experts').focus();
// 		}
// 	},
//
// 	'keydown #channel-members'(e, instance) {
// 		if (($(e.currentTarget).val() === '') && (e.keyCode === 13)) {
// 			return instance.$('.save-channel').click();
// 		}
// 	},
//
// 	'click .cancel-expertise'(event, instance) {
// 		SideNav.closeFlex(() => {
// 			instance.clearForm();
// 		});
// 	},
//
// 	'click .save-expertise'(event, instance) {
// 		event.preventDefault();
// 		const name = instance.find('#expertise').value.trim();
//
// 		if (name) {
// 			Meteor.call('AssistifyCreateExpertise', name, instance.selectedUsers.get(), (err, result) => {
// 				if (err) {
// 					console.log(err);
// 					switch (err.error) {
// 						case 'error-invalid-name':
// 							toastr.error(TAPi18n.__('Invalid_room_name', name));
// 							return;
// 						case 'error-duplicate-channel-name':
// 							toastr.error(TAPi18n.__('Duplicate_channel_name', name));
// 							return;
// 						case 'error-archived-duplicate-name':
// 							toastr.error(TAPi18n.__('Duplicate_archived_channel_name', name));
// 							return;
// 						case 'error-no-members':
// 							toastr.error(TAPi18n.__('Expertise_needs_experts', name));
// 							return;
// 						default:
// 							return handleError(err);
// 					}
// 				}
//
// 				// we're done, so close side navigation and navigate to created request-channel
// 				SideNav.closeFlex(() => {
// 					instance.clearForm();
// 				});
// 				RocketChat.callbacks.run('aftercreateCombined', {_id: result.rid, name});
// 				FlowRouter.go('expertise', {name}, FlowRouter.current().queryParams);
// 			});
// 		} else {
// 			toastr.error(TAPi18n.__('The_field_is_required', TAPi18n.__('expertise')));
// 		}
// 	}
// });
//
// Template.AssistifyAssistifyCreateExpertise.onCreated(function() {
// 	const instance = this;
// 	instance.selectedUsers = new ReactiveVar([]);
// 	instance.selectedUserNames = {};
// 	instance.isExpert = new ReactiveVar(false);
// 	instance.error = new ReactiveVar(null);
//
// 	Meteor.call('getExperts', function(err, experts) {
// 		if (err) {
// 			instance.error.set(err);
// 			instance.isExpert.set(false);
// 		} else {
// 			instance.error.set(null);
// 			if (experts) {
// 				instance.isExpert.set(experts.indexOf(Meteor.user().username) !== -1);
// 			}
// 		}
// 	});
//
// 	instance.clearForm = function() {
// 		instance.selectedUsers.set([]);
// 		instance.find('#expertise').value = '';
// 		instance.find('#experts').value = '';
// 	};
// });
