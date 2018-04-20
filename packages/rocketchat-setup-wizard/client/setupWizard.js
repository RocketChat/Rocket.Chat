Template.setupWizard.onCreated(function() {
	this.state = new ReactiveDict();
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
		states['registration-password'] = '';
		localStorage.setItem('wizard', JSON.stringify(states));
	});
});

Template.setupWizard.events({
	'click .setup-wizard-forms__footer-next'(e, t) {
		t.state.set('currentStep', t.state.get('currentStep') + 1);
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
	}
});
