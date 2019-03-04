import toastr from 'toastr';
import s from 'underscore.string';
import * as Models from 'meteor/rocketchat:models';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { hasAtLeastOnePermission } from 'meteor/rocketchat:authorization';
import { Meteor } from 'meteor/meteor';
import { handleError, t } from 'meteor/rocketchat:utils';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';

Template.adminBotCreate.helpers({
	disabled(cursor) {
		return cursor.count() === 0 ? 'disabled' : '';
	},
	canCreate() {
		return hasAtLeastOnePermission('create-bot-account');
	},

	bot() {
		return Template.instance().bot;
	},

	roles() {
		const roles = Template.instance().roles.get();
		return Models.Roles.find({ _id: { $nin:roles }, scope: 'Users' }, { sort: { description: 1, _id: 1 } });
	},

	botRoles() {
		return Template.instance().roles.get();
	},

	name() {
		return this.description || this._id;
	},
});

Template.adminBotCreate.events({
	'click .cancel'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.roles.set([]);
		t.cancel(t.find('form'));
	},

	'click .remove-role'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		let roles = t.roles.get();
		roles = roles.filter((el) => el !== this.valueOf());
		t.roles.set(roles);
		$(`[title=${ this }]`).remove();
	},

	'click #randomPassword'(e) {
		e.stopPropagation();
		e.preventDefault();
		$('#password').val(Random.id());
	},

	'click #addRole'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		if ($('#roleSelect').find(':selected').is(':disabled')) {
			return;
		}
		const botRoles = [...instance.roles.get()];
		botRoles.push($('#roleSelect').val());
		instance.roles.set(botRoles);
		$('#roleSelect').val('placeholder');
	},

	'submit form'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		t.save(e.currentTarget);
	},
});


Template.adminBotCreate.onCreated(function() {
	this.roles = new ReactiveVar(['bot']);

	const { tabBar } = Template.currentData();

	this.cancel = (form) => {
		form.reset();
		this.$('input[type=checkbox]').prop('checked', true);
		tabBar.close();
	};

	this.getBotData = () => {
		const botData = { type: 'bot' };
		botData.name = s.trim(this.$('#name').val());
		botData.username = s.trim(this.$('#username').val());
		botData.password = s.trim(this.$('#password').val());
		botData.joinDefaultChannels = this.$('#joinDefaultChannels:checked').length > 0;
		const roleSelect = this.$('.remove-role').toArray();

		if (roleSelect.length > 0) {
			const notSorted = roleSelect.map((role) => role.title);
			// Remove duplicate strings from the array
			botData.roles = notSorted.filter((el, index) => notSorted.indexOf(el) === index);
		}
		return botData;
	};

	this.validate = () => {
		const botData = this.getBotData();

		const errors = [];
		if (!botData.name) {
			errors.push('Name');
		}
		if (!botData.username) {
			errors.push('Username');
		}
		if (!botData.roles) {
			errors.push('Roles');
		}

		for (const error of Array.from(errors)) {
			toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__(error) }));
		}

		return errors.length === 0;
	};

	this.save = (form) => {
		if (!this.validate()) {
			return;
		}
		const botData = this.getBotData();

		Meteor.call('insertOrUpdateBot', botData, (error) => {
			if (error) {
				console.log(error);
				return handleError(error);
			}
			toastr.success(t('Bot_created_successfully'));
			this.cancel(form, botData.username);
		});
	};
});
