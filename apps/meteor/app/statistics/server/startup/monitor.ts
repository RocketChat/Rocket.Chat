import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { SAUMonitorClass } from '../lib/SAUMonitor';

const SAUMonitor = new SAUMonitorClass();

Meteor.startup(() => {
	let TroubleshootDisableSessionsMonitor: boolean;
	settings.watch<boolean>('Troubleshoot_Disable_Sessions_Monitor', async (value) => {
		if (TroubleshootDisableSessionsMonitor === value) {
			return;
		}
		TroubleshootDisableSessionsMonitor = value;

		if (value) {
			return SAUMonitor.stop();
		}

		await SAUMonitor.start();
	});
});
