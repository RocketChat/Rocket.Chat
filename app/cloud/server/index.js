import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import './methods';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceLicense } from './functions/getWorkspaceLicense';
import { getUserCloudAccessToken } from './functions/getUserCloudAccessToken';
import { getWorkspaceKey } from './functions/getWorkspaceKey';
import { syncWorkspace } from './functions/syncWorkspace';
import { Permissions } from '../../models';

if (Permissions) {
	Permissions.createOrUpdate('manage-cloud', ['admin']);
}

// Run token/license sync if workspace is registered
syncWorkspace();

const licenseCronName = 'Cloud Workspace Sync';

Meteor.startup(function() {
	SyncedCron.remove(licenseCronName);
	SyncedCron.add({
		name: licenseCronName,
		schedule(parser) {
			// Every 12 hours
			return parser.cron('0 */12 * * *');
		},
		job: syncWorkspace,
	});
});

export { getWorkspaceAccessToken, getWorkspaceLicense, getWorkspaceKey, getUserCloudAccessToken };
