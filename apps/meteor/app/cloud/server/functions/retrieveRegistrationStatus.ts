import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';

export function retrieveRegistrationStatus(): {
	connectToCloud: boolean;
	workspaceRegistered: boolean;
	workspaceId: string;
	uniqueId: string;
	token: string;
	email: string;
} {
	const info = {
		connectToCloud: settings.get<boolean>('Register_Server'),
		workspaceRegistered: !!settings.get('Cloud_Workspace_Client_Id') && !!settings.get('Cloud_Workspace_Client_Secret'),
		workspaceId: settings.get<string>('Cloud_Workspace_Id'),
		uniqueId: settings.get<string>('uniqueID'),
		token: '',
		email: settings.get<string>('Organization_Email'),
	};

	if (!info.email) {
		const firstUser = Users.getOldest({ emails: 1 });
		info.email = firstUser?.emails?.[0]?.address;
	}

	return info;
}
