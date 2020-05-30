import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { SAUMonitorClass } from '../lib/SAUMonitor';
import { settings } from '../../../app/settings/server';

const SAUMonitor = new SAUMonitorClass();

Meteor.startup(() => {
	let TroubleshootDisableSessionsMonitor;
	settings.get('Troubleshoot_Disable_Sessions_Monitor', (key, value) => {
		if (TroubleshootDisableSessionsMonitor === value) { return; }
		TroubleshootDisableSessionsMonitor = value;

		if (value) {
			return SAUMonitor.stop();
		}

		SAUMonitor.start(InstanceStatus.id());
	});
});
