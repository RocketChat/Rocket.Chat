import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../../app/models/server';
import { settingsRegistry, settings } from '../../../../app/settings/server';

settingsRegistry.addGroup('Engagement_Dashboard', function () {
	this.add('Engagement_Dashboard_Load_Count', 0, {
		type: 'int',
		hidden: true,
	});
});

Meteor.methods({
	engagemendDashboardCount() {
		const engagementCount = settings.get('Engagement_Dashboard_Load_Count');
		if (typeof engagementCount !== 'number') {
			return;
		}
		Settings.updateValueById('Engagement_Dashboard_Load_Count', engagementCount + 1);
	},
});
