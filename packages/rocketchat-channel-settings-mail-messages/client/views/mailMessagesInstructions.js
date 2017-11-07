import _ from 'underscore';
import toastr from 'toastr';
import resetSelection from '../resetSelection';

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
	}
});

Template.mailMessagesInstructions.events({
	'click .cancel'(e, t) {
		return t.reset();
	},
	'click .send'(e, t) {
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
	}
});

Template.mailMessagesInstructions.onCreated(function() {
	const currentData = Template.currentData();
	this.autoCompleteCollection = new Mongo.Collection(null);
	this.selectedUsers = new ReactiveVar([]);
	this.erroredEmails = new ReactiveVar([]);
	this.reset = () => {
		this.selectedUsers.set([]);
		currentData.tabBar.setTemplate('channelSettings');
		resetSelection(false);
	};
	return this.autorun(() => {
		if (Session.get('channelSettingsMailMessages') !== Session.get('openedRoom')) {
			return this.reset();
		}
	});
});
