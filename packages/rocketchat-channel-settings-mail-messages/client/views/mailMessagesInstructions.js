/* global AutoComplete Deps */

import _ from 'underscore';
import toastr from 'toastr';
import resetSelection from '../resetSelection';

/*
	* Code from https://github.com/dleitee/valid.js
	* Checks for email
	* @params email
	* @return boolean
	*/
const isEmail = email => {
	const sQtext = '[^\\x0d\\x22\\x5c]';
	const sDtext = '[^\\x0d\\x5b-\\x5d]';
	const sAtom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d]+';
	const sQuotedPair = '\\x5c[\\x00-\\x7f]';
	const sDomainLiteral = `\\x5b(${ sDtext }|${ sQuotedPair })*\\x5d`;
	const sQuotedString = `\\x22(${ sQtext }|${ sQuotedPair })*\\x22`;
	const sDomainRef = sAtom;
	const sSubDomain = `(${ sDomainRef }|${ sDomainLiteral })`;
	const sWord = `(${ sAtom }|${ sQuotedString })`;
	const sDomain = `${ sSubDomain }(\\x2e${ sSubDomain })*`;
	const sLocalPart = `${ sWord }(\\x2e${ sWord })*`;
	const sAddrSpec = `${ sLocalPart }\\x40${ sDomain }`;
	const sValidEmail = `^${ sAddrSpec }$`;
	const reg = new RegExp(sValidEmail);
	return reg.test(email);
};

const filterNames = (old) => {
	const reg = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter(f => reg.test(f)).join('');
};

Template.mailMessagesInstructions.helpers({
	name() {
		return Meteor.user().name;
	},
	email() {
		const {emails} = Meteor.user();
		return emails && emails[0] && emails[0].address;
	},
	roomName() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return room && room.name;
	},
	erroredEmails() {
		const instance = Template.instance();
		return instance && instance.erroredEmails.get().join(', ');
	},
	autocompleteSettings() {
		return {
			limit: 10,
			rules: [
				{
					collection: 'CachedChannelList',
					subscription: 'userAutocomplete',
					field: 'username',
					template: Template.userSearch,
					noMatchTemplate: Template.userSearchEmpty,
					matchAll: true,
					filter: {
						exceptions: Template.instance().selectedUsers.get()
					},
					selector(match) {
						return {
							term: match
						};
					},
					sort: 'username'
				}
			]
		};
	},
	selectedUsers() {
		return Template.instance().selectedUsers.get();
	},
	selectedEmails() {
		return Template.instance().selectedEmails.get();
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
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac): param;
	},
	items() {
		return Template.instance().ac.filteredList();
	}
});

Template.mailMessagesInstructions.events({
	'click .js-cancel'(e, t) {
		t.reset(true);
	},
	'click .js-send'(e, t) {
		t.$('.error').hide();
		const $btn = t.$('button.send');
		const oldBtnValue = $btn.html();
		$btn.html(TAPi18n.__('Sending'));
		const selectedMessages = $('.messages-box .message.selected');
		let error = false;
		if (selectedMessages.length === 0) {
			t.$('.error-select').show();
			error = true;
		}
		if (t.$('input[name=to_emails]').val().trim()) {
			const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;
			const emails = t.$('input[name=to_emails]').val().trim().split(',');
			const erroredEmails = [];
			emails.forEach((email) => {
				if (!rfcMailPatternWithName.test(email.trim())) {
					erroredEmails.push(email.trim());
				}
			});
			t.erroredEmails.set(erroredEmails);
			if (erroredEmails.length > 0) {
				t.$('.error-invalid-emails').show();
				error = true;
			}
		} else if (!t.selectedUsers.get().length) {
			t.$('.error-missing-to').show();
			error = true;
		}
		if (error) {
			return $btn.html(oldBtnValue);
		}
		const data = {
			rid: Session.get('openedRoom'),
			to_users: t.selectedUsers.get(),
			to_emails: t.$('input[name=to_emails]').val().trim(),
			subject: t.$('input[name=subject]').val().trim(),
			messages: selectedMessages.map(function(i, message) {
				return message.id;
			}).toArray(),
			language: localStorage.getItem('userLanguage')
		};
		return Meteor.call('mailMessages', data, function(err, result) {
			$btn.html(oldBtnValue);
			if (err != null) {
				return handleError(err);
			}
			console.log(result);
			toastr.success(TAPi18n.__('Your_email_has_been_queued_for_sending'));
			return t.reset();
		});
	},
	'click .select-all'(e, t) {
		t.$('.error-select').hide();
		const view = Blaze.getView($('.messages-box')[0]);
		if (view != null) {
			if (typeof view.templateInstance === 'function') {
				const chat = ChatMessage.find({
					rid: Session.get('openedRoom')
				});
				view.templateInstance().selectedMessages = _.pluck(chat && chat.fetch(), '_id');
			}
		}
		return $('.messages-box .message').addClass('selected');
	},
	'autocompleteselect #to_users'(event, instance, doc) {
		instance.selectedUsers.set(instance.selectedUsers.get().concat(doc.username));
		event.currentTarget.value = '';
		return event.currentTarget.focus();
	},
	'click .remove-to-user'() {
		let users = Template.instance().selectedUsers.get();
		users = _.reject(Template.instance().selectedUsers.get(), (_id) => {
			return _id === this.valueOf();
		});
		Template.instance().selectedUsers.set(users);
		return $('#to_users').focus();
	},
	'click .rc-input--usernames .rc-tags__tag'({target}, t) {
		const {username} = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'click .rc-input--usernames .rc-tags__tag-icon'(e, t) {
		const {username} = Blaze.getData(t.find('.rc-tags__tag-text'));
		t.selectedUsers.set(t.selectedUsers.get().filter(user => user.username !== username));
	},
	'click .rc-input--emails .rc-tags__tag'({target}, t) {
		const {text} = Blaze.getData(target);
		t.selectedEmails.set(t.selectedEmails.get().filter(email => email.text !== text));
	},
	'click .rc-input--emails .rc-tags__tag-icon'(e, t) {
		const {text} = Blaze.getData(t.find('.rc-tags__tag-text'));
		t.selectedEmails.set(t.selectedEmails.get().filter(email => email.text !== text));
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
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
	'keydown [name="emails"]'(e, t) {
		const input = e.target;
		if ([9, 13, 188].includes(e.keyCode) && isEmail(input.value)) {
			e.preventDefault();
			const emails = t.selectedEmails;
			const emailsArr = emails.get();
			emailsArr.push({text: input.value});
			input.value = '';
			return emails.set(emailsArr);
		}

		if ([8, 46].includes(e.keyCode) && input.value === '') {
			const emails = t.selectedEmails;
			const emailsArr = emails.get();
			emailsArr.pop();
			return emails.set(emailsArr);
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
	}
});

Template.mailMessagesInstructions.onRendered(function() {
	const users = this.selectedUsers;

	this.firstNode.querySelector('[name="users"]').focus();
	this.ac.element = this.firstNode.querySelector('[name="users"]');
	this.ac.$element = $(this.ac.element);
	this.ac.$element.on('autocompleteselect', function(e, {item}) {
		const usersArr = users.get();
		usersArr.push(item);
		users.set(usersArr);
	});
});

Template.mailMessagesInstructions.onCreated(function() {
	resetSelection(true);

	this.selectedUsers = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');

	const filter = {exceptions :[Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username))};
	Deps.autorun(() => {
		filter.exceptions = [Meteor.user().username].concat(this.selectedUsers.get().map(u => u.username));
	});

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

	this.ac.tmplInst = this;

	this.selectedEmails = new ReactiveVar([]);

	this.autoCompleteCollection = new Mongo.Collection(null);
	this.erroredEmails = new ReactiveVar([]);
	this.reset = (bool) => {
		this.selectedUsers.set([]);
		this.selectedEmails.set([]);
		resetSelection(bool);
	};
});

Template.mailMessagesInstructions.onDestroyed(function() {
	Template.instance().reset(false);
});
