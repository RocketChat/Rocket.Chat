import { cronJobs } from '@rocket.chat/cron';
import { Meteor } from 'meteor/meteor';

import { connectWorkspace } from '../../../server/lib/cloud/connectWorkspace';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../../../server/lib/cloud/getWorkspaceAccessToken';
import { getWorkspaceAccessTokenWithScope } from '../../../server/lib/cloud/getWorkspaceAccessTokenWithScope';
import { retrieveRegistrationStatus } from '../../../server/lib/cloud/retrieveRegistrationStatus';
import { syncWorkspace } from '../../../server/lib/cloud/syncWorkspace';
import { SystemLogger } from '../../../server/lib/logger/system';
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

			SystemLogger.info('Successfully registered with token provided by REG_TOKEN!');
		} catch (err: any) {
			SystemLogger.error({ msg: 'An error occurred registering with token.', err });
		}
	}

	setImmediate(async () => {
		try {
			await syncWorkspace();
		} catch (err: any) {
			if (err instanceof CloudWorkspaceAccessTokenEmptyError) {
				return;
			}
			if (err.type && err.type === 'AbortError') {
				return;
			}
			SystemLogger.error({ msg: 'An error occurred syncing workspace.', err });
		}
	});
	const minute = Math.floor(Math.random() * 60);
	await cronJobs.add(licenseCronName, `${minute} */12 * * *`, async () => {
		try {
			await syncWorkspace();
		} catch (err: any) {
			if (err instanceof CloudWorkspaceAccessTokenEmptyError) {
				return;
			}
			if (err.type && err.type === 'AbortError') {
				return;
			}
			SystemLogger.error({ msg: 'An error occurred syncing workspace.', err });
		}
	});
});

export { getWorkspaceAccessToken, getWorkspaceAccessTokenWithScope };
