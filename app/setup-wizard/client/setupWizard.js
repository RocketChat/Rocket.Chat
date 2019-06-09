import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { hasRole } from '../../authorization';
import { Users } from '../../models';
import { t, handleError } from '../../utils';

const cannotSetup = () => {
	const showSetupWizard = settings.get('Show_Setup_Wizard');
	if (!showSetupWizard) {
		// Setup Wizard state is not defined yet
		return;
	}

	const userId = Meteor.userId();
	const user = userId && Users.findOne(userId, { fields: { status: true } });
	if (userId && (!user || !user.status)) {
		// User and its status are not defined yet
		return;
	}

	const isComplete = showSetupWizard === 'completed';
	const noUserLoggedInAndIsNotPending = !userId && showSetupWizard !== 'pending';
	const userIsLoggedButIsNotAdmin = userId && !hasRole(userId, 'admin');

	return isComplete || noUserLoggedInAndIsNotPending || userIsLoggedButIsNotAdmin;
};

const registerAdminUser = (state, callback) => {
	const registrationData = Object.entries(state)
		.filter(([key]) => /registration-/.test(key))
		.map(([key, value]) => [key.replace('registration-', ''), value])
		.reduce((o, [key, value]) => ({ ...o, [key]: value }), {});

	Meteor.call('registerUser', registrationData, (error) => {
		if (error) {
			return handleError(error);
		}

		callbacks.run('userRegistered');
		Meteor.loginWithPassword(registrationData.email, registrationData.pass, (error) => {
			if (error) {
				if (error.error === 'error-invalid-email') {
					toastr.success(t('We_have_sent_registration_email'));
					return false;
				}
				return handleError(error);
			}

			Session.set('forceLogin', false);
			Meteor.call('setUsername', registrationData.username, (error) => {
				if (error) {
					return handleError(error);
				}

				callbacks.run('usernameSet');
				callback && callback();
			});
		});
	});
};

const persistSettings = (state, callback) => {
	const setupSettings = Object.entries(state)
		.filter(([key]) => !/registration-|registerServer|optIn|currentStep|invalidUsername|invalidEmail/.test(key))
		.map(([_id, value]) => ({ _id, value }))
		.concat([
			{
				_id: 'Statistics_reporting',
				value: state.registerServer,
			},
			{
				_id: 'Apps_Framework_enabled',
				value: state.registerServer,
			},
			{
				_id: 'Register_Server',
				value: state.registerServer,
			},
			{
				_id: 'Allow_Marketing_Emails',
				value: state.optIn,
			},
		]);

	settings.batchSet(setupSettings, (error) => {
		if (error) {
			return handleError(error);
		}

		callback && callback();
	});
};

Template.setupWizard.onCreated(function() {
	this.state = new ReactiveDict();
	this.state.set('currentStep', 1);
	this.state.set('registerServer', true);
	this.state.set('optIn', true);

	this.wizardSettings = new ReactiveVar([]);
	this.allowStandaloneServer = new ReactiveVar(false);

	if (localStorage.getItem('wizardFinal')) {
		FlowRouter.go('setup-wizard-final');
		return;
	}

	const jsonString = localStorage.getItem('wizard');
	const state = (jsonString && JSON.parse(jsonString)) || {};
	Object.entries(state).forEach((entry) => this.state.set(...entry));

	this.autorun((c) => {
		const cantSetup = cannotSetup();
		if (typeof cantSetup === 'undefined') {
			return;
		}

		if (cantSetup) {
			c.stop();
			FlowRouter.go('home');
			return;
		}

		const state = this.state.all();
		state['registration-pass'] = '';
		localStorage.setItem('wizard', JSON.stringify(state));

		if (Meteor.userId()) {
			Meteor.call('getSetupWizardParameters', (error, { settings, allowStandaloneServer }) => {
				if (error) {
					return handleError(error);
				}

				this.wizardSettings.set(settings);
				this.allowStandaloneServer.set(allowStandaloneServer);
			});

			if (this.state.get('currentStep') === 1) {
				this.state.set('currentStep', 2);
			} else {
				this.state.set('registration-pass', '');
			}
		} else if (this.state.get('currentStep') !== 1) {
			this.state.set('currentStep', 1);
		}
	});
});

Template.setupWizard.onRendered(function() {
	$('#initial-page-loading').remove();
});

Template.setupWizard.events({
	'submit .setup-wizard-forms__box'() {
		return false;
	},
	'click .setup-wizard-forms__footer-next'(e, t) {
		switch (t.state.get('currentStep')) {
			case 1: {
				const usernameValue = t.state.get('registration-username');
				const usernameRegex = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
				t.state.set('invalidUsername', !usernameRegex.test(usernameValue));

				const emailValue = t.state.get('registration-email');
				const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i;
				t.state.set('invalidEmail', !emailRegex.test(emailValue));

				if (t.state.get('invalidUsername') || t.state.get('invalidEmail')) {
					return false;
				}

				registerAdminUser(t.state.all(), () => t.state.set('currentStep', 2));
				return false;
			}
			case 2: {
				t.state.set('currentStep', 3);
				return false;
			}
			case 3: {
				t.state.set('currentStep', 4);
				return false;
			}
			case 4: {
				persistSettings(t.state.all(), () => {
					localStorage.removeItem('wizard');
					localStorage.setItem('wizardFinal', true);

					if (t.state.get('registerServer')) {
						Meteor.call('cloud:registerWorkspace', (error) => {
							if (error) {
								console.warn(error);
								return;
							}

							FlowRouter.go('setup-wizard-final');
						});
					} else {
						FlowRouter.go('setup-wizard-final');
					}
				});
				return false;
			}
		}

		return false;
	},
	'click .setup-wizard-forms__footer-back'(e, t) {
		switch (t.state.get('currentStep')) {
			case 2:
				t.state.set('currentStep', 1);
				break;
			case 3:
				t.state.set('currentStep', 2);
				break;
			case 4:
				t.state.set('currentStep', 3);
				break;
		}

		return false;
	},
	'input .js-setting-data'({ currentTarget: { name, value } }, t) {
		t.state.set(name, value);
	},
	'click input[name="registerServer"]'({ currentTarget: { value } }, t) {
		const oldValue = t.state.get('registerServer');
		const newValue = value === 'true';
		t.state.set('registerServer', newValue);

		if (!oldValue && newValue) {
			t.state.set('optIn', true);
		}

		if (!newValue) {
			t.state.set('optIn', false);
		}

		return false;
	},
	'click input[name="optIn"]'({ currentTarget: { checked } }, t) {
		t.state.set('optIn', checked);
		return false;
	},
});

Template.setupWizard.helpers({
	currentStep() {
		return Template.instance().state.get('currentStep');
	},
	currentStepTitle() {
		switch (Template.instance().state.get('currentStep')) {
			case 1:
				return 'Admin_Info';
			case 2:
				return 'Organization_Info';
			case 3:
				return 'Server_Info';
			case 4:
				return 'Register_Server';
		}
	},
	formLoadStateClass() {
		switch (Template.instance().state.get('currentStep')) {
			case 1:
				return settings.get('Show_Setup_Wizard') === 'pending' && 'setup-wizard-forms__box--loaded';
			case 2:
			case 3:
				return Template.instance().wizardSettings.get().length > 0 && 'setup-wizard-forms__box--loaded';
			case 4:
				return 'setup-wizard-forms__box--loaded';
		}
	},
	showBackButton() {
		switch (Template.instance().state.get('currentStep')) {
			case 3:
				return true;
			case 4:
				return true;
		}

		return false;
	},
	isContinueDisabled() {
		switch (Template.instance().state.get('currentStep')) {
			case 1:
				return Object.entries(Template.instance().state.all())
					.filter(([key, value]) => /registration-/.test(key) && !value)
					.length !== 0;
		}

		return false;
	},
	infoArgs() {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
		};
	},
	adminInfoArgs() {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
			name: t.state.get('registration-name'),
			username: t.state.get('registration-username'),
			email: t.state.get('registration-email'),
			password: t.state.get('registration-pass'),
			invalidUsername: t.state.get('invalidUsername'),
			invalidEmail: t.state.get('invalidEmail'),
		};
	},
	registerServerArgs() {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
			allowStandaloneServer: t.allowStandaloneServer.get(),
			registerServer: t.allowStandaloneServer.get() ? t.state.get('registerServer') : true,
			optIn: t.state.get('optIn'),
		};
	},
	customStepArgs(step) {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
			step,
			settings: t.wizardSettings.get()
				.filter((setting) => setting.wizard.step === step)
				.sort((a, b) => a.wizard.order - b.wizard.order)
				.map(({ type, _id, i18nLabel, values }) => ({
					type,
					id: _id,
					label: i18nLabel,
					value: t.state.get(_id),
					options: (
						type === 'select'
						&& values
						&& values.map(({ i18nLabel, key }) => ({ optionLabel: i18nLabel, optionValue: key }))
					) || (
						type === 'language'
						&& [{
							optionLabel: 'Default',
							optionValue: '',
						}].concat(
							Object.entries(TAPi18n.getLanguages())
								.map(([key, { name }]) => ({ optionLabel: name, optionValue: key }))
								.sort((a, b) => a.key - b.key)
						)
					),
					isValueSelected: (value) => value === t.state.get(_id),
				})),
		};
	},
});

Template.setupWizardInfo.helpers({
	stepItemModifier(step) {
		const { currentStep } = Template.currentData();

		if (currentStep === step) {
			return 'setup-wizard-info__steps-item--active';
		}

		if (currentStep > step) {
			return 'setup-wizard-info__steps-item--past';
		}

		return '';
	},
	stepTitle(step) {
		switch (step) {
			case 1:
				return 'Admin_Info';
			case 2:
				return 'Organization_Info';
			case 3:
				return 'Server_Info';
			case 4:
				return 'Register_Server';
		}
	},
});
