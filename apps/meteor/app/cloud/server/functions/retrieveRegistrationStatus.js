import { settings } from '../../../settings';
import { Users } from '../../../models';

export function retrieveRegistrationStatus() {
	const info = {
		connectToCloud: settings.get('Register_Server'),
		workspaceRegistered: !!settings.get('Cloud_Workspace_Client_Id'),
		workspaceId: settings.get('Cloud_Workspace_Id'),
		uniqueId: settings.get('uniqueID'),
		token: '',
		email: settings.get('Organization_Email'),
	};

	if (!info.email) {
		const firstUser = Users.getOldest({ emails: 1 });
		info.email = firstUser && firstUser.emails && firstUser.emails[0].address;
	}

	return info;
}
