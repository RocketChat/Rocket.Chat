import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import './methods';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceAccessTokenWithScope } from './functions/getWorkspaceAccessTokenWithScope';
import { getWorkspaceLicense } from './functions/getWorkspaceLicense';
import { getUserCloudAccessToken } from './functions/getUserCloudAccessToken';
import { getWorkspaceKey } from './functions/getWorkspaceKey';
import { syncWorkspace } from './functions/syncWorkspace';
import { Permissions } from '../../models';
import { settings } from '../../settings/server';

if (Permissions) {
	Permissions.create('manage-cloud', ['admin']);
}

const licenseCronName = 'Cloud Workspace Sync';

Meteor.startup(function() {
	// run token/license sync if registered
	let TroubleshootDisableWorkspaceSync;
	settings.get('Troubleshoot_Disable_Workspace_Sync', (key, value) => {
		if (TroubleshootDisableWorkspaceSync === value) { return; }
		TroubleshootDisableWorkspaceSync = value;

		if (value) {
			return SyncedCron.remove(licenseCronName);
		}

		Meteor.defer(() => syncWorkspace());

		SyncedCron.add({
			name: licenseCronName,
			schedule(parser) {
				// Every 12 hours
				return parser.cron('0 */12 * * *');
			},
			job: syncWorkspace,
		});
	});
});

export { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope, getWorkspaceLicense, getWorkspaceKey, getUserCloudAccessToken };
