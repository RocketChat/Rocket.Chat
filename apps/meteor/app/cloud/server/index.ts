import { cronJobs } from '@rocket.chat/cron';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../server/lib/logger/system';
import { connectWorkspace } from './functions/connectWorkspace';
import { getWorkspaceAccessToken } from './functions/getWorkspaceAccessToken';
import { getWorkspaceAccessTokenWithScope } from './functions/getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from './functions/retrieveRegistrationStatus';
import { syncWorkspace } from './functions/syncWorkspace';
import './methods';

const licenseCronName = 'Cloud Workspace Sync';

Meteor.startup(async () => {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (process.env.REG_TOKEN && process.env.REG_TOKEN !== '' && !workspaceRegistered) {
		try {
			SystemLogger.info('REG_TOKEN Provided. Attempting to register');

			if (!(await connectWorkspace(process.env.REG_TOKEN))) {
				throw new Error("Couldn't register with token.  Please make sure token is valid or hasn't already been used");
			}

			console.log('Successfully registered with token provided by REG_TOKEN!');
		} catch (e: any) {
			SystemLogger.error('An error occurred registering with token.', e.message);
		}
	}

	setImmediate(() => syncWorkspace());
	await cronJobs.add(licenseCronName, '0 */12 * * *', async () => {
		await syncWorkspace();
	});
});

export { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope };
