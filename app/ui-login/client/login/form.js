import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import _ from 'underscore';
import s from 'underscore.string';
import toastr from 'toastr';

import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { t, handleError } from '../../../utils';

Template.loginForm.helpers({
	userName() {
		const user = Meteor.user();
		return user && user.username;
	},
	namePlaceholder() {
		if (settings.get('Accounts_RequireNameForSignUp')) {
			return t('Name');
		}
		return t('Name_optional');
	},
	showFormLogin() {
		return settings.get('Accounts_ShowFormLogin');
	},
	state(...state) {
		return state.indexOf(Template.instance().state.get()) > -1;
	},
	btnLoginSave() {
		if (Template.instance().loading.get()) {
			return `${ t('Please_wait') }...`;
		}
		switch (Template.instance().state.get()) {
			case 'register':
				return t('Register');
			case 'login':
				return t('Login');
			case 'email-verification':
				return t('Send_confirmation_email');
			case 'forgot-password':
				return t('Reset_password');
		}
	},
	loginTerms() {
		return settings.get('Layout_Login_Terms');
	},
	registrationAllowed() {
		const validSecretUrl = Template.instance().validSecretURL;
		return settings.get('Accounts_RegistrationForm') === 'Public' || (validSecretUrl && validSecretUrl.get());
	},
	linkReplacementText() {
		return settings.get('Accounts_RegistrationForm_LinkReplacementText');
	},
	passwordResetAllowed() {
		return settings.get('Accounts_PasswordReset');
	},
	requirePasswordConfirmation() {
		return settings.get('Accounts_RequirePasswordConfirmation');
	},
	emailOrUsernamePlaceholder() {
		return settings.get('Accounts_EmailOrUsernamePlaceholder') || t('Email_or_username');
	},
	passwordPlaceholder() {
		return settings.get('Accounts_PasswordPlaceholder') || t('Password');
	},
	confirmPasswordPlaceholder() {
		return settings.get('Accounts_ConfirmPasswordPlaceholder') || t('Confirm_password');
	},
	manuallyApproveNewUsers() {
		return settings.get('Accounts_ManuallyApproveNewUsers');
	},
	typedEmail() {
		return s.trim(Template.instance().typedEmail);
	},
});

Template.loginForm.events({
	'submit #login-card'(event, instance) {
		event.preventDefault();
		$(event.target).find('button.login').focus();
		instance.loading.set(true);
		const formData = instance.validate();
		const state = instance.state.get();
		if (formData) {
			if (state === 'email-verification') {
				Meteor.call('sendConfirmationEmail', s.trim(formData.email), () => {
					instance.loading.set(false);
					callbacks.run('userConfirmationEmailRequested');
					toastr.success(t('We_have_sent_registration_email'));
					return instance.state.set('login');
				});
				return;
			}
			if (state === 'forgot-password') {
				Meteor.call('sendForgotPasswordEmail', s.trim(formData.email), (err) => {
					if (err) {
						handleError(err);
						return instance.state.set('login');
					}
					instance.loading.set(false);
					callbacks.run('userForgotPasswordEmailRequested');
					toastr.success(t('If_this_email_is_registered'));
					return instance.state.set('login');
				});
				return;
			}
			if (state === 'register') {
				formData.secretURL = FlowRouter.getParam('hash');
				return Meteor.call('registerUser', formData, function(error) {
					instance.loading.set(false);
					if (error != null) {
						if (error.reason === 'Email already exists.') {
							toastr.error(t('Email_already_exists'));
						} else {
							handleError(error);
						}
						return;
					}
					callbacks.run('userRegistered');
					return Meteor.loginWithPassword(s.trim(formData.email), formData.pass, function(error) {
						if (error && error.error === 'error-invalid-email') {
							return instance.state.set('wait-email-activation');
						} if (error && error.error === 'error-user-is-not-activated') {
							return instance.state.set('wait-activation');
						}
						Session.set('forceLogin', false);
					});
				});
			}
			let loginMethod = 'loginWithPassword';
			if (settings.get('LDAP_Enable')) {
				loginMethod = 'loginWithLDAP';
			}
			if (settings.get('CROWD_Enable')) {
				loginMethod = 'loginWithCrowd';
			}
			return Meteor[loginMethod](s.trim(formData.emailOrUsername), formData.pass, function(error) {
				instance.loading.set(false);
				if (error != null) {
					if (error.error === 'error-user-is-not-activated') {
						return toastr.error(t('Wait_activation_warning'));
					} if (error.error === 'error-invalid-email') {
						instance.typedEmail = formData.emailOrUsername;
						return instance.state.set('email-verification');
					} if (error.error === 'error-user-is-not-activated') {
						toastr.error(t('Wait_activation_warning'));
					} else if (error.error === 'error-app-user-is-not-allowed-to-login') {
						toastr.error(t('App_user_not_allowed_to_login'));
					} else if (error.error === 'error-login-blocked-for-ip') {
						toastr.error(t('Error_login_blocked_for_ip'));
					} else if (error.error === 'error-login-blocked-for-user') {
						toastr.error(t('Error_login_blocked_for_user'));
					} else {
						return toastr.error(t('User_not_found_or_incorrect_password'));
					}
				}
				Session.set('forceLogin', false);
			});
		}
	},
	'click .register'() {
		Template.instance().state.set('register');
		return callbacks.run('loginPageStateChange', Template.instance().state.get());
	},
	'click .back-to-login'() {
		Template.instance().state.set('login');
		return callbacks.run('loginPageStateChange', Template.instance().state.get());
	},
	'click .forgot-password'() {
		Template.instance().state.set('forgot-password');
		return callbacks.run('loginPageStateChange', Template.instance().state.get());
	},
});

Template.loginForm.onCreated(function() {
	const instance = this;
	this.loading = new ReactiveVar(false);

	if (Session.get('loginDefaultState')) {
		this.state = new ReactiveVar(Session.get('loginDefaultState'));
	} else {
		this.state = new ReactiveVar('login');
	}

	Tracker.autorun(() => {
		const registrationForm = settings.get('Accounts_RegistrationForm');
		if (registrationForm === 'Disabled' && this.state.get() === 'register') {
			this.state.set('login');
		}
	});

	this.validSecretURL = new ReactiveVar(false);
	this.validate = function() {
		const formData = $('#login-card').serializeArray();
		const formObj = {};
		const validationObj = {};
		formData.forEach((field) => {
			formObj[field.name] = field.value;
		});
		const state = instance.state.get();
		if (state !== 'login') {
			if (!(formObj.email && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+\b/i.test(formObj.email))) {
				validationObj.email = t('Invalid_email');
			}
		}
		if (state === 'login') {
			if (!formObj.emailOrUsername) {
				validationObj.emailOrUsername = t('Invalid_email');
			}
		}
		if (state !== 'forgot-password' && state !== 'email-verification') {
			if (!formObj.pass) {
				validationObj.pass = t('Invalid_pass');
			}
		}
		if (state === 'register') {
			if (settings.get('Accounts_RequireNameForSignUp') && !formObj.name) {
				validationObj.name = t('Invalid_name');
			}
			if (settings.get('Accounts_RequirePasswordConfirmation') && formObj['confirm-pass'] !== formObj.pass) {
				validationObj['confirm-pass'] = t('Invalid_confirm_pass');
			}
			if (settings.get('Accounts_ManuallyApproveNewUsers') && !formObj.reason) {
				validationObj.reason = t('Invalid_reason');
			}
		}
		$('#login-card h2').removeClass('error');
		$('#login-card input.error, #login-card select.error').removeClass('error');
		$('#login-card .input-error').text('');
		if (!_.isEmpty(validationObj)) {
			$('#login-card h2').addClass('error');

			Object.keys(validationObj).forEach((key) => {
				const value = validationObj[key];
				$(`#login-card input[name=${ key }], #login-card select[name=${ key }]`).addClass('error');
				$(`#login-card input[name=${ key }]~.input-error, #login-card select[name=${ key }]~.input-error`).text(value);
			});
			instance.loading.set(false);
			return false;
		}
		return formObj;
	};
	if (FlowRouter.getParam('hash')) {
		return Meteor.call('checkRegistrationSecretURL', FlowRouter.getParam('hash'), () => this.validSecretURL.set(true));
	}
});

Template.loginForm.onRendered(function() {
	Session.set('loginDefaultState');
	return Tracker.autorun(() => {
		callbacks.run('loginPageStateChange', this.state.get());
		switch (this.state.get()) {
			case 'login':
			case 'forgot-password':
			case 'email-verification':
				return Meteor.defer(function() {
					return $('input[name=email]').select().focus();
				});
			case 'register':
				return Meteor.defer(function() {
					return $('input[name=name]').select().focus();
				});
		}
	});
});
