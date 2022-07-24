import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { settings } from '../../../settings';
import { Button } from '../../../ui';
import { t } from '../../../utils';
import { callbacks } from '../../../../lib/callbacks';
import { dispatchToastMessage } from '../../../../client/lib/toast';

Template.username.onCreated(function () {
	const self = this;
	self.customFields = new ReactiveVar();
	self.username = new ReactiveVar();

	Tracker.autorun(() => {
		const Accounts_CustomFields = settings.get('Accounts_CustomFields');
		if (typeof Accounts_CustomFields === 'string' && Accounts_CustomFields.trim() !== '') {
			try {
				return this.customFields.set(JSON.parse(settings.get('Accounts_CustomFields')));
			} catch (error1) {
				return console.error('Invalid JSON for Accounts_CustomFields');
			}
		} else {
			return this.customFields.set(null);
		}
	});

	const validateCustomFields = function (formObj, validationObj) {
		const customFields = self.customFields.get();
		if (!customFields) {
			return;
		}

		for (const field in formObj) {
			if (formObj.hasOwnProperty(field)) {
				const value = formObj[field];
				if (customFields[field] == null) {
					continue;
				}
				const customField = customFields[field];
				if (customField.required === true && !value) {
					validationObj[field] = t('Field_required');
					return validationObj[field];
				}
				if (customField.maxLength != null && value.length > customField.maxLength) {
					validationObj[field] = t('Max_length_is', customField.maxLength);
					return validationObj[field];
				}
				if (customField.minLength != null && value.length < customField.minLength) {
					validationObj[field] = t('Min_length_is', customField.minLength);
					return validationObj[field];
				}
			}
		}
	};

	this.validate = function () {
		const formData = $('#login-card').serializeArray();
		const formObj = {};
		const validationObj = {};
		formData.forEach((field) => {
			formObj[field.name] = field.value;
		});

		$('#login-card h2').removeClass('error');
		$('#login-card input.error, #login-card select.error').removeClass('error');
		$('#login-card .input-error').text('');
		validateCustomFields(formObj, validationObj);
		if (!_.isEmpty(validationObj)) {
			$('#login-card h2').addClass('error');

			Object.keys(validationObj).forEach((key) => {
				const value = validationObj[key];
				$(`#login-card input[name=${key}], #login-card select[name=${key}]`).addClass('error');
				$(`#login-card input[name=${key}]~.input-error, #login-card select[name=${key}]~.input-error`).text(value);
			});

			return false;
		}
		return formObj;
	};

	return Meteor.call('getUsernameSuggestion', function (error, username) {
		self.username.set({
			ready: true,
			username,
		});
		return Meteor.defer(() => self.find('input').focus());
	});
});

Template.username.helpers({
	username() {
		return Template.instance().username.get();
	},

	backgroundUrl() {
		const asset = settings.get('Assets_background');
		const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset && (asset.url || asset.defaultUrl)) {
			return `${prefix}/${asset.url || asset.defaultUrl}`;
		}
	},
});

Template.username.events({
	'focus .input-text input'(event) {
		return $(event.currentTarget).parents('.input-text').addClass('focus');
	},

	'blur .input-text input'(event) {
		if (event.currentTarget.value === '') {
			return $(event.currentTarget).parents('.input-text').removeClass('focus');
		}
	},
	'reset #login-card'() {
		Meteor.logout();
	},
	'submit #login-card'(event, instance) {
		event.preventDefault();

		const formData = instance.validate();

		const username = instance.username.get();
		username.empty = false;
		username.error = false;
		username.invalid = false;
		instance.username.set(username);

		const button = $(event.target).find('button.login');
		Button.loading(button);

		if (!formData) {
			Button.reset(button);
			return;
		}

		const usernameValue = $('#username').val().trim();
		if (usernameValue === '') {
			username.empty = true;
			instance.username.set(username);
			Button.reset(button);
			return;
		}

		Meteor.call('saveCustomFields', formData, function (err) {
			if (err != null) {
				dispatchToastMessage({ type: 'error', message: err.error });
			}
		});

		Meteor.call('setUsername', usernameValue, function (err) {
			if (err != null) {
				if (err.error === 'username-invalid') {
					username.invalid = true;
				} else if (err.error === 'error-blocked-username') {
					username.blocked = true;
				} else {
					username.unavailable = true;
				}
				username.username = usernameValue;
				username.escaped = _.escape(usernameValue);
			}

			Button.reset(button);
			instance.username.set(username);
			return callbacks.run('usernameSet');
		});
	},
});
