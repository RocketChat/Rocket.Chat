import { Settings, Users } from '../../../../app/models/server';
import { ISetting } from '../../../../definition/ISetting';

type WizardSettings = Array<ISetting>;

const url = 'https://rocket.chat/sales-contact';

export const getSeatsRequestLink = (): string => {
	const workspaceId = Settings.findOneById('Cloud_Workspace_Id');
	const activeUsers = Users.getActiveLocalUserCount();
	const wizardSettings: WizardSettings = Settings.findSetupWizardSettings().fetch();

	const newUrl = new URL(url);
	workspaceId?.value && newUrl.searchParams.append('workspaceId', String(workspaceId.value));
	activeUsers && newUrl.searchParams.append('activeUsers', String(activeUsers));
	wizardSettings.forEach((setting) => {
		if (['Industry', 'Country', 'Size'].includes(setting._id) && setting.value) {
			newUrl.searchParams.append(setting._id.toLowerCase(), String(setting?.value));
		}
	});

	return newUrl.toString();
};
