import { HTTP } from 'meteor/http';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';

export function getWorkspaceLicense() {
	const token = getWorkspaceAccessToken();

	if (!token) {
		return { updated: false, license: '' };
	}


	let licenseResult;
	try {
		licenseResult = HTTP.get(`${ RocketChat.settings.get('Cloud_Workspace_Registration_Client_Uri') }/license`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
		});
	} catch (e) {
		return { updated: false, license: '' };
	}

	const remoteLicense = licenseResult.data;
	const currentLicense = RocketChat.settings.get('Cloud_Workspace_License');

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return { updated: false, license: '' };
	}

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	return { updated: true, license: remoteLicense.license };
}
