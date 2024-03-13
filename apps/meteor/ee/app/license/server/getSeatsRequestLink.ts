import type { ISetting } from '@rocket.chat/core-typings';
import { Settings, Users, WorkspaceCredentials } from '@rocket.chat/models';

type WizardSettings = Array<ISetting>;

export const getSeatsRequestLink = async (url: string, params?: Record<string, string>): Promise<string> => {
	const workspaceId = await WorkspaceCredentials.getCredentialById('workspace_id');
	if (!workspaceId) {
		throw new Error('No workspace id found');
	}

	const activeUsers = await Users.getActiveLocalUserCount();
	const wizardSettings: WizardSettings = await Settings.findSetupWizardSettings().toArray();

	const newUrl = new URL(url);

	if (workspaceId?.value) {
		newUrl.searchParams.append('workspaceId', workspaceId.value);
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
