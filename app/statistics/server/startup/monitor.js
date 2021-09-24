import { Meteor } from 'meteor/meteor';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { SAUMonitorClass } from '../lib/SAUMonitor';
import { SettingsVersion4 } from '../../../settings/server';

const SAUMonitor = new SAUMonitorClass();

Meteor.startup(() => {
	let TroubleshootDisableSessionsMonitor;
	SettingsVersion4.watch('Troubleshoot_Disable_Sessions_Monitor', (value) => {
		if (TroubleshootDisableSessionsMonitor === value) { return; }
		TroubleshootDisableSessionsMonitor = value;

		if (value) {
			return SAUMonitor.stop();
		}

		SAUMonitor.start(InstanceStatus.id());
	});
});
