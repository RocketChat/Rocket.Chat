import s from 'underscore.string';

Template.setupWizard.onCreated(function() {
	this.state = new ReactiveDict();
	this.finalStep = new ReactiveVar(false);
	this.wizardSettings = new ReactiveVar([]);
	Meteor.call('getWizardSettings', (error, result) => {
		if (result) {
			this.wizardSettings.set(result);
		}
	});

	const storage = JSON.parse(localStorage.getItem('wizard'));
	if (storage) {
		Object.entries(storage).forEach(([key, value]) => {
			this.state.set(key, value);
		});
	}

	this.state.set('currentStep', 1);

	Tracker.autorun(() => {
		const states = this.state.all();
		states['registration-pass'] = '';
		localStorage.setItem('wizard', JSON.stringify(states));
	});
});

Template.setupWizard.events({
	'click .go-home'() {
		RocketChat.settings.set('Server_First_Access', false);
	},
	'click .setup-wizard-forms__footer-next'(e, t) {
		const currentStep = t.state.get('currentStep');

		if (currentStep === 4) {
			const state = Template.instance().state.all();
			const registration = Object.entries(state).filter(key => /registration-/.test(key));
			const registrationData = Object.assign(...registration.map(d => ({[d[0].replace('registration-', '')]: d[1]})));

			Meteor.call('registerUser', registrationData, error => {
				if (error) {
					return handleError(error);
				}

				RocketChat.callbacks.run('userRegistered');

				Meteor.loginWithPassword(s.trim(registrationData.email), registrationData.pass, error => {
					if (error && error.error === 'error-invalid-email') {
						toastr.success(t('We_have_sent_registration_email'));
						return false;
					}

					Session.set('forceLogin', false);

					Meteor.call('setUsername', registrationData.username, error => {
						if (error) {
							return handleError(error);
						}

						RocketChat.callbacks.run('usernameSet');

						const settings = Object.entries(state).filter(key => !/registration-|registerServer|currentStep/.test(key));
						settings.forEach(setting => {
							RocketChat.settings.set(setting[0], setting[1]);
						});

						RocketChat.settings.set('Statistics_reporting', JSON.parse(t.state.get('registerServer')));

						t.finalStep.set(true);
					});
				});
			});

			return false;
		}

		t.state.set('currentStep', currentStep + 1);
	},
	'click .setup-wizard-forms__footer-back'(e, t) {
		t.state.set('currentStep', t.state.get('currentStep') - 1);
	},
	'input .js-setting-data'(e, t) {
		t.state.set(e.currentTarget.name, e.currentTarget.value);
	}
});

Template.setupWizard.helpers({
	currentStepTemplate() {
		return `setup-wizard-step${ Template.instance().state.get('currentStep') }`;
	},
	currentStep() {
		return Template.instance().state.get('currentStep');
	},
	itemModifier(step) {
		const current = Template.instance().state.get('currentStep');

		if (current === step) {
			return 'setup-wizard-info__steps-item--active';
		}

		if (current > step) {
			return 'setup-wizard-info__steps-item--past';
		}

		return '';
	},
	getValue(name) {
		return Template.instance().state.get(name);
	},
	selectedValue(setting, optionValue) {
		return Template.instance().state.get(setting) === optionValue;
	},
	isDisabled() {
		if (Template.instance().state.get('currentStep') === 1) {
			const state = Template.instance().state.all();

			if (Object.entries(state).filter(([key, value]) => /registration-/.test(key) && !value).length) {
				return 'disabled';
			}
		}

		return '';
	},
	headerTitle(step) {
		if (!step) {
			step = Template.instance().state.get('currentStep');
		}

		switch (step) {
			case 1: return t('Admin_Info');
			case 2: return t('Organization_Info');
			case 3: return t('Server_Info');
			case 4: return t('Register_Server');
		}
	},
	showStep() {
		const currentStep = Template.instance().state.get('currentStep');
		if (currentStep === 2 || currentStep === 3) {
			return 'setup-wizard-forms__content-step--active';
		}

		return '';
	},
	getSettings(step) {
		return Template.instance().wizardSettings.get()
			.filter(setting => setting.wizard.step === step)
			.sort((a, b) => a.wizard.order - b.wizard.order);
	},
	languages() {
		const languages = TAPi18n.getLanguages();

		const result = Object.entries(languages).map(language => {
			const obj = language[1];
			obj.key = language[0];
			return obj;
		}).sort((a, b) => {
			if (a.key < b.key) {
				return -1;
			}

			if (a.key > b.key) {
				return 1;
			}

			return 0;
		});

		result.unshift({
			'name': 'Default',
			'en': 'Default',
			'key': ''
		});

		return result;
	},
	finalStep() {
		return Template.instance().finalStep.get();
	}
});
