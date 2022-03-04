import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../../app/models/server';
import { settings } from '../../../../app/settings/server';

Meteor.methods({
	engagemendDashboardCount() {
		const engagementCount = settings.get('Engagement_Dashboard_Load_Count');
		if (typeof engagementCount !== 'number') {
			return;
		}
		Settings.updateValueById('Engagement_Dashboard_Load_Count', engagementCount + 1);
	},
});
