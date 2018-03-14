Template.setupWizard.onCreated(function() {
	this.setupStep = new ReactiveVar(0);
	this.maxSteps = 7;
});

Template.setupWizard.events({
	'click .setup-wizard-button-next'(e, t) {
		const current = t.setupStep.get();

		if (current === t.maxSteps) {
			return false;
		}

		t.setupStep.set(current + 1);
	},
	'click .setup-wizard-button-back'(e, t) {
		const current = t.setupStep.get();

		if (current === 0) {
			return false;
		}

		t.setupStep.set(current - 1);
	}
});

Template.setupWizard.helpers({
	currentStepTemplate() {
		return `setup-wizard-step${ Template.instance().setupStep.get() }`;
	},
	currentStep() {
		return Template.instance().setupStep.get();
	}
});
