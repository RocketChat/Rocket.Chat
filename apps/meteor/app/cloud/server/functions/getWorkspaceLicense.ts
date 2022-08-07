import { HTTP } from 'meteor/http';
import { Settings } from '@rocket.chat/models';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { LICENSE_VERSION } from '../license';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getWorkspaceLicense() {
	const token = await getWorkspaceAccessToken();

	if (!token) {
		return { updated: false, license: '' };
	}

	let licenseResult;
	try {
		licenseResult = HTTP.get(`${settings.get('Cloud_Workspace_Registration_Client_Uri')}/license?version=${LICENSE_VERSION}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	} catch (e: any) {
		if (e.response?.data?.error) {
			SystemLogger.error(`Failed to update license from Rocket.Chat Cloud.  Error: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
		}

		return { updated: false, license: '' };
	}

	const remoteLicense = licenseResult.data;
	const currentLicense = await Settings.findOne('Cloud_Workspace_License');

	if (!currentLicense || !currentLicense._updatedAt) {
		throw new Error('Failed to retrieve current license');
	}

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return { updated: false, license: '' };
	}

	await Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	callbacks.run('workspaceLicenseChanged', remoteLicense.license);

	return { updated: true, license: remoteLicense.license };
}
