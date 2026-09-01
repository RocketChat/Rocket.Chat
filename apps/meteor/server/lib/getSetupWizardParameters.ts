import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { settings } from '../settings';

export type SetupWizardParameters = {
	settings: ISetting[];
	serverAlreadyRegistered: boolean;
};

export const getSetupWizardParameters = async (): Promise<SetupWizardParameters> => ({
	settings: await Settings.findSetupWizardSettings().toArray(),
	serverAlreadyRegistered: !!settings.get('Cloud_Workspace_Client_Id') || process.env.DEPLOY_PLATFORM === 'rocket-cloud',
});
