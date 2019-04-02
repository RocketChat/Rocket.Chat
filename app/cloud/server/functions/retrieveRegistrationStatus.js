import { settings } from '../../../settings';
import { Users } from '../../../models';

export function retrieveRegistrationStatus() {
	const info = {
		connectToCloud: settings.get('Register_Server'),
		workspaceRegistered: (settings.get('Cloud_Workspace_Client_Id')) ? true : false,
		userAssociated: (settings.get('Cloud_Workspace_Account_Associated')) ? true : false,
		workspaceId: settings.get('Cloud_Workspace_Id'),
		uniqueId: settings.get('uniqueID'),
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
