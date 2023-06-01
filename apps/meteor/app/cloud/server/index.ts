import { Meteor } from 'meteor/meteor';
import { cronJobs } from '@rocket.chat/cron';

import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceAccessTokenWithScope } from './functions/getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { syncWorkspace } from './functions/syncWorkspace';
import { connectWorkspace } from './functions/connectWorkspace';
import { settings } from '../../settings/server';
import { SystemLogger } from '../../../server/lib/logger/system';
import './methods';

const licenseCronName = 'Cloud Workspace Sync';

Meteor.startup(async function () {
	// run token/license sync if registered
	let TroubleshootDisableWorkspaceSync: boolean;
	settings.watch<boolean>('Troubleshoot_Disable_Workspace_Sync', async (value) => {
		if (TroubleshootDisableWorkspaceSync === value) {
			return;
		}
		TroubleshootDisableWorkspaceSync = value;

		if (value) {
			return cronJobs.remove(licenseCronName);
		}

		setImmediate(() => syncWorkspace());
		await cronJobs.add(licenseCronName, '0 */12 * * *', async () => {
			await syncWorkspace();
		});
	});

	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (process.env.REG_TOKEN && process.env.REG_TOKEN !== '' && !workspaceRegistered) {
		try {
			SystemLogger.info('REG_TOKEN Provided. Attempting to register');

			if (!(await connectWorkspace(process.env.REG_TOKEN))) {
				throw new Error("Couldn't register with token.  Please make sure token is valid or hasn't already been used");
			}

			console.log('Successfully registered with token provided by REG_TOKEN!');
		} catch (e: any) {
			SystemLogger.error('An error occured registering with token.', e.message);
		}
	}
});

export { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope };
