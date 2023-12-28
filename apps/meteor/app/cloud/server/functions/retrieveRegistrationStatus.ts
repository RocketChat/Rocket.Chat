import { Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

export async function retrieveRegistrationStatus(): Promise<{
	workspaceRegistered: boolean;
	workspaceId: string;
	uniqueId: string;
	token: string;
	email: string;
}> {
	const info = {
		workspaceRegistered: !!settings.get('Cloud_Workspace_Client_Id') && !!settings.get('Cloud_Workspace_Client_Secret'),
		workspaceId: settings.get<string>('Cloud_Workspace_Id'),
		uniqueId: settings.get<string>('uniqueID'),
		token: '',
		email: settings.get<string>('Organization_Email') || '',
	};

	if (!info.email) {
		const firstUser = await Users.getOldest({ projection: { emails: 1 } });
		info.email = firstUser?.emails?.[0]?.address || info.email;
	}

	return info;
}
