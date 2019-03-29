import { settings } from '../../../settings';
import { Users } from '../../../models';

export function retrieveRegistrationStatus() {
	const info = {
		registeredWithWizard: settings.get('Register_Server'),
		workspaceConnected: (settings.get('Cloud_Workspace_Client_Id')) ? true : false,
		userAssociated: (settings.get('Cloud_Workspace_Account_Associated')) ? true : false,
		token: '',
		email: '',
	};

	const firstUser = Users.getOldest({ emails: 1 });
	info.email = firstUser && firstUser.emails[0].address;

	if (settings.get('Organization_Email')) {
		info.email = settings.get('Organization_Email');
	}

	return info;
}
