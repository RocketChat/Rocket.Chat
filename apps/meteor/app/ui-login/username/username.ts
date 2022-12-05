import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { Blaze } from 'meteor/blaze';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { settings } from '../../settings/client';
import { Button } from '../../ui/client';
import { t } from '../../utils/client';
import { callbacks } from '../../../lib/callbacks';
import { dispatchToastMessage } from '../../../client/lib/toast';
import './username.html';

type UsernameTemplateInstance = Blaze.TemplateInstance<Record<string, never>> & {
	customFields: ReactiveVar<Record<
		string,
		{
			required?: boolean;
			maxLength?: number;
			minLength?: number;
		}
	> | null>;
	username: ReactiveVar<{
		ready: boolean;
		username: string;
		empty?: boolean;
		error?: boolean;
		invalid?: boolean;
		escaped?: string;
		blocked?: boolean;
		unavailable?: boolean;
	}>;
	validate: () => unknown;
};
Template.username.onCreated(function (this: UsernameTemplateInstance) {
	this.customFields = new ReactiveVar(null);
	this.username = new ReactiveVar({
		ready: false,
		username: '',
	});

	this.autorun(() => {
		const accountsCustomFields = settings.get('Accounts_CustomFields');
		if (typeof accountsCustomFields === 'string' && accountsCustomFields.trim() !== '') {
			try {
				return this.customFields.set(JSON.parse(settings.get('Accounts_CustomFields')));
			} catch (error1) {
				return console.error('Invalid JSON for Accounts_CustomFields');
			}
		} else {
			return this.customFields.set(null);
		}
	});

	const validateCustomFields = (formObj: Record<string, string>, validationObj: Record<string, string>) => {
		const customFields = this.customFields.get();
		if (!customFields) {
			return;
		}

		for (const field in formObj) {
			if (formObj.hasOwnProperty(field)) {
				const value = formObj[field];
				if (!customFields[field]) {
					continue;
				}
				const customField = customFields[field];
				if (customField.required === true && !value) {
					validationObj[field] = t('Field_required');
					return validationObj[field];
				}
				if (customField.maxLength && value.length > customField.maxLength) {
					validationObj[field] = t('Max_length_is', customField.maxLength);
					return validationObj[field];
				}
				if (customField.minLength && value.length < customField.minLength) {
					validationObj[field] = t('Min_length_is', customField.minLength);
					return validationObj[field];
				}
			}
		}
	};

	this.validate = () => {
		const formData = $('#login-card').serializeArray();
		const formObj = formData.reduce((formObj, { name, value }) => {
			formObj[name] = value;
			return formObj;
		}, {} as Record<string, string>);
		const validationObj = {} as Record<string, string>;

		$('#login-card h2').removeClass('error');
		$('#login-card input.error, #login-card select.error').removeClass('error');
		$('#login-card .input-error').text('');
		validateCustomFields(formObj, validationObj);
		if (Object.keys(validationObj).length > 0) {
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

	Meteor.call('getUsernameSuggestion', (_error: Error, username: string) => {
		this.username.set({
			ready: true,
			username,
		});
		return Meteor.defer(() => this.find('input').focus());
	});
});

Template.username.helpers({
	username() {
		return (Template.instance() as UsernameTemplateInstance).username.get();
	},

	backgroundUrl() {
		const asset = settings.get('Assets_background');
		const prefix = window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		if (asset && (asset.url || asset.defaultUrl)) {
			return `${prefix}/${asset.url || asset.defaultUrl}`;
		}
	},
});

Template.username.events({
	'focus .input-text input'(event: JQuery.FocusEvent<HTMLInputElement>) {
		return $(event.currentTarget).parents('.input-text').addClass('focus');
	},

	'blur .input-text input'(event: JQuery.BlurEvent<HTMLInputElement>) {
		if (event.currentTarget.value === '') {
			return $(event.currentTarget).parents('.input-text').removeClass('focus');
		}
	},
	'reset #login-card'() {
		Meteor.logout();
	},
	'submit #login-card'(event: JQuery.SubmitEvent<HTMLFormElement>, instance: UsernameTemplateInstance) {
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

		const usernameValue = ($('#username').val() as string | undefined)?.trim();
		if (usernameValue === '') {
			username.empty = true;
			instance.username.set(username);
			Button.reset(button);
			return;
		}

		Meteor.call('saveCustomFields', formData, (error: Meteor.Error) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		});

		Meteor.call('setUsername', usernameValue, (err: Meteor.Error) => {
			if (err) {
				if (err.error === 'username-invalid') {
					username.invalid = true;
				} else if (err.error === 'error-blocked-username') {
					username.blocked = true;
				} else {
					username.unavailable = true;
				}
				username.username = usernameValue ?? '';
				username.escaped = escapeHTML(usernameValue ?? '');
			}

			Button.reset(button);
			instance.username.set(username);
			return callbacks.run('usernameSet');
		});
	},
});
