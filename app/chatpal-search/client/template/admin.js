import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../settings';
import { hasPermission } from '../../../authorization';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { validateEmail } from '../../../../lib/emailValidator';

Template.ChatpalAdmin.onCreated(function () {
	this.validateEmail = validateEmail;

	this.apiKey = new ReactiveVar();

	const lang = settings.get('Language');

	this.lang = lang === 'de' || lang === 'en' ? lang : 'en';

	this.tac = new ReactiveVar();

	Meteor.call('chatpalUtilsGetTaC', this.lang, (err, data) => {
		this.tac.set(data);
	});
});

Template.ChatpalAdmin.events({
	'submit form'(e, t) {
		e.preventDefault();

		const email = e.target.email.value;
		const tac = e.target.readtac.checked;

		if (!tac) {
			return dispatchToastMessage({
				type: 'error',
				message: TAPi18n.__('Chatpal_ERROR_TAC_must_be_checked'),
			});
		}
		if (!email || email === '') {
			return dispatchToastMessage({
				type: 'error',
				message: TAPi18n.__('Chatpal_ERROR_Email_must_be_set'),
			});
		}
		if (!t.validateEmail(email)) {
			return dispatchToastMessage({
				type: 'error',
				message: TAPi18n.__('Chatpal_ERROR_Email_must_be_valid'),
			});
		}

		// TODO register
		try {
			Meteor.call('chatpalUtilsCreateKey', email, (err, key) => {
				if (!key) {
					return dispatchToastMessage({
						type: 'error',
						message: TAPi18n.__('Chatpal_ERROR_username_already_exists'),
					});
				}

				dispatchToastMessage({
					type: 'info',
					message: TAPi18n.__('Chatpal_created_key_successfully'),
				});

				t.apiKey.set(key);
			});
		} catch (e) {
			console.log(e);
			dispatchToastMessage({
				type: 'error',
				message: TAPi18n.__('Chatpal_ERROR_username_already_exists'),
			}); // TODO error messages
		}
	},
});

// template
Template.ChatpalAdmin.helpers({
	apiKey() {
		return Template.instance().apiKey.get();
	},
	isAdmin() {
		return hasPermission('manage-chatpal');
	},
	tac() {
		return Template.instance().tac.get();
	},
});
