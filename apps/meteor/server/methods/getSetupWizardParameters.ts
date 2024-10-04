import type { ISetting } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { execSync } from 'child_process';

import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		getSetupWizardParameters(): Promise<{
			settings: ISetting[];
			serverAlreadyRegistered: boolean;
		}>;
	}
}

Meteor.methods<ServerMethods>({
	async getSetupWizardParameters() {
		const totalMemory = parseInt(execSync('grep MemTotal /proc/meminfo').toString().split(':')[1].trim().split(' ')[0], 10) / 1024;
		if (totalMemory < 2560) {
			throw new Meteor.Error('error-insufficient-ram', 'At least 2.5GB of RAM is required to install Rocket.Chat.');
		}

		const setupWizardSettings = await Settings.findSetupWizardSettings().toArray();
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered,
		};
	},
});
