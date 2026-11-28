import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';

type WizardSettings = Array<ISetting>;

export const getSeatsRequestLink = async (url: string, params?: Record<string, string>): Promise<string> => {
	const workspaceId = await Settings.getValueById<string>('Cloud_Workspace_Id');
	const activeUsers = await Users.getActiveLocalUserCount();
	const wizardSettings: WizardSettings = await Settings.findSetupWizardSettings().toArray();

	const newUrl = new URL(url);

	if (workspaceId) {
		newUrl.searchParams.append('workspaceId', workspaceId);
	}

	if (activeUsers) {
		newUrl.searchParams.append('activeUsers', String(activeUsers));
	}

	wizardSettings.forEach(({ _id, value }) => {
		if (['Industry', 'Country', 'Size'].includes(_id) && typeof value === 'string' && value) {
			newUrl.searchParams.append(_id.toLowerCase(), value);
		}
	});

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			newUrl.searchParams.append(key, String(value));
		});
	}

	return newUrl.toString();
};
