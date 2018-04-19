Template.setupWizard.onCreated(function() {
	this.currentStep = new ReactiveVar(3);
	this.wizardSettings;
	Meteor.call('getWizardSettings', (error, result) => {
		if (result) {
			this.wizardSettings = result;
		}
	});
});

Template.setupWizard.events({
	'click .setup-wizard-button-next'(e, t) {
		const current = t.currentStep.get();

		t.setupStep.set(current + 1);
	},
	'click .setup-wizard-button-back'(e, t) {
		const current = t.currentStep.get();

		t.setupStep.set(current - 1);
	}
});

Template.setupWizard.helpers({
	currentStepTemplate() {
		return `setup-wizard-step${ Template.instance().setupStep.get() }`;
	},
	currentStep() {
		return Template.instance().setupStep.get();
	},
	itemModifier(step) {
		const current = Template.instance().currentStep.get();

		if (current === step) {
			return 'setup-wizard-info__steps-item--active';
		}

		if (current > step) {
			return 'setup-wizard-info__steps-item--past';
		}

		return '';
	}
});
