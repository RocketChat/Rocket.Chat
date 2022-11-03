import { SyncedCron } from 'meteor/littledata:synced-cron';

import { smarsh } from './lib/rocketchat';
import { settings } from '../../settings/server';

const smarshJobName = 'Smarsh EML Connector';

settings.watchMultiple(['Smarsh_Enabled', 'Smarsh_Email', 'From_Email', 'Smarsh_Interval'], function __addSmarshSyncedCronJobDebounced() {
	if (SyncedCron.nextScheduledAtDate(smarshJobName)) {
		SyncedCron.remove(smarshJobName);
	}

	if (settings.get('Smarsh_Enabled') && settings.get('Smarsh_Email') !== '' && settings.get('From_Email') !== '') {
		SyncedCron.add({
			name: smarshJobName,
			schedule: (parser) => parser.text(settings.get('Smarsh_Interval').replace(/_/g, ' ')),
			job: smarsh.generateEml,
		});
	}
});
