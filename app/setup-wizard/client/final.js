import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { settings } from '../../settings';
import { Users } from '../../models';
import { hasRole } from '../../authorization';

Template.setupWizardFinal.onCreated(function() {
	const isSetupWizardDone = Meteor._localStorage.getItem('wizardFinal');
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
		}
	});
});

Template.setupWizardFinal.onRendered(function() {
	$('#initial-page-loading').remove();
});

Template.setupWizardFinal.events({
	'click .js-finish'() {
		settings.set('Show_Setup_Wizard', 'completed', function() {
			Meteor._localStorage.removeItem('wizard');
			Meteor._localStorage.removeItem('wizardFinal');
			FlowRouter.go('home');
		});
	},
});

Template.setupWizardFinal.helpers({
	siteUrl() {
		return settings.get('Site_Url');
	},
});
