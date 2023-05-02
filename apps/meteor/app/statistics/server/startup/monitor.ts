import { Meteor } from 'meteor/meteor';

import { SAUMonitorClass } from '../lib/SAUMonitor';
import { settings } from '../../../settings/server';

const SAUMonitor = new SAUMonitorClass();

Meteor.startup(() => {
	let TroubleshootDisableSessionsMonitor: boolean;
	settings.watch<boolean>('Troubleshoot_Disable_Sessions_Monitor', (value) => {
		if (TroubleshootDisableSessionsMonitor === value) {
			return;
		}
		TroubleshootDisableSessionsMonitor = value;

		if (value) {
			return SAUMonitor.stop();
		}

		void SAUMonitor.start();
	});
});
