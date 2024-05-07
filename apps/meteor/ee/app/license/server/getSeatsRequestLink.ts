import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users } from '@rocket.chat/models';

type WizardSettings = Array<ISetting>;

export const getSeatsRequestLink = async (url: string, params?: Record<string, string>): Promise<string> => {
	const workspaceId = await Settings.findOneById('Cloud_Workspace_Id');
	const activeUsers = await Users.getActiveLocalUserCount();
	const wizardSettings: WizardSettings = await Settings.findSetupWizardSettings().toArray();

	const newUrl = new URL(url);

	if (workspaceId?.value) {
		newUrl.searchParams.append('workspaceId', String(workspaceId.value));
	}

	if (activeUsers) {
		newUrl.searchParams.append('activeUsers', String(activeUsers));
	}

	wizardSettings
		.filter(({ _id, value }) => ['Industry', 'Country', 'Size'].includes(_id) && value)
		.forEach((setting) => {
			newUrl.searchParams.append(setting._id.toLowerCase(), String(setting.value));
		});

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			newUrl.searchParams.append(key, String(value));
		});
	}

	return newUrl.toString();
};
