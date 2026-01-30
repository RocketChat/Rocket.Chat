import type { ISetting } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

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
		const setupWizardSettings = await Settings.findSetupWizardSettings().toArray();
		const serverAlreadyRegistered = !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud';

		return {
			settings: setupWizardSettings,
			serverAlreadyRegistered,
		};
	},
});
