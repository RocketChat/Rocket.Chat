import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { settings } from '../../settings';
import { Users } from '../../models';
import { hasRole } from '../../authorization';

Template.setupWizardFinal.onCreated(function() {
	const isSetupWizardDone = localStorage.getItem('wizardFinal');
	if (isSetupWizardDone === null) {
		FlowRouter.go('setup-wizard');
	}

	this.autorun((c) => {
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

		c.stop();

		const isComplete = showSetupWizard === 'completed';
		const noUserLoggedInAndIsNotPending = !userId && showSetupWizard !== 'pending';
		const userIsLoggedButIsNotAdmin = userId && !hasRole(userId, 'admin');
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
		settings.set('Show_Setup_Wizard', 'completed', function() {
			localStorage.removeItem('wizard');
			localStorage.removeItem('wizardFinal');
			FlowRouter.go('home');
		});
	},
});

Template.setupWizardFinal.helpers({
	siteUrl() {
		return settings.get('Site_Url');
	},
});
