const steps = [
  {
		number: 1,
    name: 'Admin_Info'
  },
  {
		number: 2,
    name: 'Organization_Info'
  },
  {
		number: 3,
    name: 'Server_Info'
  },
  {
		number: 4,
    name: 'Register_Server'
  }
];

Template.setupWizard.onCreated(function() {
	this.state = new ReactiveDict();
	this.hasAdmin = new ReactiveVar(false);
	this.wizardSettings = new ReactiveVar([]);
	this.invalidUsername = new ReactiveVar(false);
	this.invalidEmail = new ReactiveVar(false);

	if (localStorage.getItem('wizardFinal')) {
		FlowRouter.go('setup-wizard-final');
		return;
	}

	this.showRemainingInfoSteps = () => {
		Meteor.call('getWizardSettings', (error, wizardSettings) => {
			if (error) {
				return handleError(error);
			}

			this.wizardSettings.set(wizardSettings);
			this.state.set('currentStep', 2);

			this.autorun(c => {
				const showSetupWizard = RocketChat.settings.get('Show_Setup_Wizard');
				const userId = Meteor.userId();

				if (!userId) {
					c.stop();
					this.state.set('currentStep', 1);
					return;
				}

				if (showSetupWizard === 'completed' || !RocketChat.authz.hasRole(userId, 'admin')) {
					c.stop();
					FlowRouter.go('home');
					return;
				}

				const state = this.state.all();
				state['registration-pass'] = '';
				localStorage.setItem('wizard', JSON.stringify(state));
			});
		});
	};

	this.processAdminInfoStep = () => {
		const usernameValue = this.state.get('registration-username');
		const usernameRegex = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
		this.invalidUsername.set(!usernameRegex.test(usernameValue));

		const emailValue = this.state.get('registration-email');
		const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i;
		this.invalidEmail.set(!emailRegex.test(emailValue));

		if (this.invalidUsername.get() || this.invalidEmail.get()) {
			return false;
		}

		const registrationData = Object.entries(this.state.all())
			.filter(([ key ]) => /registration-/.test(key))
			.map(([ key, value ]) => ([ key.replace('registration-', ''), value ]))
			.reduce((o, [ key, value ]) => ({ ...o, [key]: value }), {});

		Meteor.call('registerUser', registrationData, error => {
			if (error) {
				return handleError(error);
			}

			RocketChat.callbacks.run('userRegistered');

			Meteor.loginWithPassword(registrationData.email, registrationData.pass, error => {
				if (error) {
					if (error.error === 'error-invalid-email') {
						toastr.success(t('We_have_sent_registration_email'));
						return false;
					} else {
						return handleError(error);
					}
				}

				Session.set('forceLogin', false);

				Meteor.call('setUsername', registrationData.username, error => {
					if (error) {
						return handleError(error);
					}

					RocketChat.callbacks.run('usernameSet');

					this.hasAdmin.set(true);
					this.showRemainingInfoSteps();
				});
			});
		});
	};

	this.processOrganizationInfoStep = () => {
		this.state.set('currentStep', 3);
		return false;
	};

	this.processServerInfoStep = () => {
		setSettingsAndGo(this.state.all());
		return false;
	};

	this.processRegisterServerStep = () => {
		setSettingsAndGo(this.state.all(), JSON.parse(this.state.get('registerServer') || true));
		return false;
	};

	const jsonString = localStorage.getItem('wizard');
	const state = jsonString && JSON.parse(jsonString) || {};
	Object.entries(state).forEach(entry => this.state.set(...entry));

	this.autorun(c => {
		const showSetupWizard = RocketChat.settings.get('Show_Setup_Wizard');
		if (!showSetupWizard) {
			// Setup Wizard state is not defined yet
			return;
		}

		const userId = Meteor.userId();
		const user = userId && RocketChat.models.Users.findOne(userId, { fields: { status: true } });
		if (userId && (!user || !user.status)) {
			// User and its status are not defined yet
			return;
		}

		c.stop();

		const isComplete = showSetupWizard === 'completed';
		const noUserLoggedInAndIsNotPending = !userId && showSetupWizard !== 'pending';
		const userIsLoggedButIsNotAdmin = userId && !RocketChat.authz.hasRole(userId, 'admin');
		if (isComplete || noUserLoggedInAndIsNotPending || userIsLoggedButIsNotAdmin) {
			FlowRouter.go('home');
			return;
		}

		if (Meteor.userId()) {
			this.hasAdmin.set(true);
			this.showRemainingInfoSteps();
		} else {
			this.hasAdmin.set(false);
			this.state.set('currentStep', 1);
		}
	});
});

Template.setupWizard.onRendered(function() {
	$('#initial-page-loading').remove();
});

const setSettingsAndGo = (settings, registerServer = true) => {
	const settingsFilter = Object.entries(settings)
		.filter(([key]) => !/registration-|registerServer|currentStep/.test(key))
		.map(([_id, value]) => ({_id, value}));

	settingsFilter.push({
		_id: 'Statistics_reporting',
		value: registerServer
	});

	RocketChat.settings.batchSet(settingsFilter, function(err) {
		if (err) {
			return handleError(err);
		}

		localStorage.setItem('wizardFinal', true);
		FlowRouter.go('setup-wizard-final');
	});
};

Template.setupWizard.events({
	'submit .setup-wizard-forms__box'() {
		return false;
	},
	'click .setup-wizard-forms__footer-next'(e, t) {
		const currentStep = t.state.get('currentStep');
		const hasAdmin = t.hasAdmin.get();

		if (currentStep === 1) {
			return t.processAdminInfoStep();
		}

		if (currentStep === 2) {
			return t.processOrganizationInfoStep();
		}

		if (currentStep === 3) {
			return t.processServerInfoStep();
		}

		if (currentStep === 4) {
			return t.processRegisterServerStep();
		}

		return false;
	},
	'click .setup-wizard-forms__footer-back'(e, t) {
		t.state.set('currentStep', t.state.get('currentStep') - 1);
	},
	'input .js-setting-data'(e, t) {
		t.state.set(e.currentTarget.name, e.currentTarget.value);
	}
});

Template.setupWizard.helpers({
	currentStep() {
		return Template.instance().state.get('currentStep');
	},
	stepTitle(step) {
		if (!step) {
			step = Template.instance().state.get('currentStep');
		}

		return steps[step - 1] && t(steps[step - 1].name);
	},
	formLoadStateClass() {
		const currentStep = Template.instance().state.get('currentStep');

		if (currentStep === 1 && RocketChat.settings.get('Show_Setup_Wizard') === 'pending') {
			return 'setup-wizard-forms__box--loaded';
		}

		if ((currentStep === 2 || currentStep == 3) && Template.instance().wizardSettings.get().length > 0) {
			return 'setup-wizard-forms__box--loaded';
		}
	},
	hasAdmin() {
		return Template.instance().hasAdmin.get();
	},
	showBackButton() {
		if (Template.instance().hasAdmin.get()) {
			if (Template.instance().state.get('currentStep') > 2) {
				return true;
			}

			return false;
		}

		if (Template.instance().state.get('currentStep') > 1) {
			return true;
		}

		return false;
	},
	isContinueDisabled() {
		const currentStep = Template.instance().state.get('currentStep');
		if (currentStep === 1) {
			const validFields = Object.entries(Template.instance().state.all())
				.filter(([key, value]) => /registration-/.test(key) && !value);

			if (validFields.length) {
				return true;
			}
		}

		return false;
	},
	adminInfoArgs() {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
			name: t.state.get('registration-name'),
			username: t.state.get('registration-username'),
			email: t.state.get('registration-email'),
			invalidUsername: t.invalidUsername.get(),
			invalidEmail: t.invalidEmail.get()
		};
	},
	registerServerArgs() {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep')
		};
	},
	customStepArgs(step) {
		const t = Template.instance();

		return {
			currentStep: t.state.get('currentStep'),
			step,
			settings: t.wizardSettings.get()
				.filter(setting => setting.wizard.step === step)
				.sort((a, b) => a.wizard.order - b.wizard.order)
				.map(({ type, _id, i18nLabel, values }) => ({
					type,
					id: _id,
					label: i18nLabel,
					value: t.state.get(_id),
					options: (
						type === 'select' &&
						values &&
						values.map(({ i18nLabel, key }) => ({ optionLabel: i18nLabel, optionValue: key }))
					) || (
						type === 'language' &&
						([{
							optionLabel: 'Default',
							optionValue: ''
						}].concat(
							Object.entries(TAPi18n.getLanguages())
								.map(([ key, { name } ]) => ({ optionLabel: name, optionValue: key }))
								.sort((a, b) => a.key - b.key)
						))
					),
					isValueSelected: (value) => value === t.state.get(_id)
				}))
		};
	}
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
		if (!step) {
			step = Template.currentData().currentStep;
		}

		return steps[step - 1] && t(steps[step - 1].name);
	},
});

Template.setupWizardFinal.onCreated(function() {
	const isSetupWizardDone = localStorage.getItem('wizardFinal');
	if (isSetupWizardDone === null) {
		FlowRouter.go('setup-wizard');
	}

	this.autorun(c => {
		const showSetupWizard = RocketChat.settings.get('Show_Setup_Wizard');
		if (!showSetupWizard) {
			// Setup Wizard state is not defined yet
			return;
		}

		const userId = Meteor.userId();
		const user = userId && RocketChat.models.Users.findOne(userId, { fields: { status: true } });
		if (userId && (!user || !user.status)) {
			// User and its status are not defined yet
			return;
		}

		c.stop();

		const isComplete = showSetupWizard === 'completed';
		const noUserLoggedInAndIsNotPending = !userId && showSetupWizard !== 'pending';
		const userIsLoggedButIsNotAdmin = userId && !RocketChat.authz.hasRole(userId, 'admin');
		if (isComplete || noUserLoggedInAndIsNotPending || userIsLoggedButIsNotAdmin) {
			FlowRouter.go('home');
			return;
		}
	});
});

Template.setupWizardFinal.onRendered(function() {
	$('#initial-page-loading').remove();
});

Template.setupWizardFinal.events({
	'click .js-finish'() {
		RocketChat.settings.set('Show_Setup_Wizard', 'completed', function() {
			localStorage.removeItem('wizard');
			localStorage.removeItem('wizardFinal');
			FlowRouter.go('home');
		});
	}
});

Template.setupWizardFinal.helpers({
	siteUrl() {
		return RocketChat.settings.get('Site_Url');
	}
});
