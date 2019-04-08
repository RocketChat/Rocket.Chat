export function retrieveRegistrationStatus() {
	const info = {
		registeredWithWizard: RocketChat.settings.get('Register_Server'),
		workspaceConnected: (RocketChat.settings.get('Cloud_Workspace_Client_Id')) ? true : false,
		userAssociated: (RocketChat.settings.get('Cloud_Workspace_Account_Associated')) ? true : false,
		token: '',
		email: '',
	};

	const firstUser = RocketChat.models.Users.getOldest({ emails: 1 });
	info.email = firstUser && firstUser.emails[0].address;

	if (RocketChat.settings.get('Organization_Email')) {
		info.email = RocketChat.settings.get('Organization_Email');
	}

	return info;
}
