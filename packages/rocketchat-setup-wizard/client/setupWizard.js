Template.setupWizard.onCreated(function() {
	this.state = new ReactiveDict();
	this.wizardSettings = {};
	Meteor.call('getWizardSettings', (error, result) => {
		if (result) {
			this.wizardSettings = result;
		}
	});

	const storage = JSON.parse(localStorage.getItem('wizard'));
	Object.entries(storage).forEach(([key, value]) => {
		this.state.set(key, value);
	});

	this.state.set('currentStep', 1);

	Tracker.autorun(() => {
		const states = this.state.all();
		states['step1-password'] = '';
		localStorage.setItem('wizard', JSON.stringify(states));
	});
});

Template.setupWizard.events({
	'click .setup-wizard-forms__footer-next'(e, t) {
		t.state.set('currentStep', t.state.get('currentStep') + 1);
	},
	'click .setup-wizard-button-back'(e, t) {
		t.state.set('currentStep', t.state.get('currentStep') - 1);
	},
	'input input[data-step]'(e, t) {
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
	isDisabled() {
		if (Template.instance().state.get('currentStep') === 1) {
			const state = Template.instance().state.all();

			if (Object.entries(state).filter(e => /step1-/.test(e[0]) && !e[1]).length) {
				return 'disabled';
			}
		}

		return '';
	}
});
