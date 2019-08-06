
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';


FlowRouter.route('/setup-wizard', {
	name: 'setup-wizard',

	async action() {
		await import('./setupWizard');
		BlazeLayout.render('setupWizard');
	},
});

FlowRouter.route('/setup-wizard/final', {
	name: 'setup-wizard-final',

	async action() {
		await import('./final');
		BlazeLayout.render('setupWizardFinal');
	},
});
