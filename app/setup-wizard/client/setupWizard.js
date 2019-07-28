import { Template } from 'meteor/templating';

import { SetupWizard } from '../../../client/components/setupWizard/SetupWizard';

Template.setupWizard.helpers({
	reactComponentArgs: () => ({
		Component: SetupWizard,
	}),
});
