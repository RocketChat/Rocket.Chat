import { Template } from 'meteor/templating';

import { SetupWizard } from '../../../client/components/setupWizard/SetupWizard';

import './setupWizard.html';

Template.setupWizard.helpers({
	reactComponentArgs: () => ({
		Component: SetupWizard,
	}),
});
