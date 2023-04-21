import { HTTP } from 'meteor/http';
import { Settings } from '@rocket.chat/models';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { LICENSE_VERSION } from '../license';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getWorkspaceLicense(): Promise<{ updated: boolean; license: string }> {
	const currentLicense = await Settings.findOne('Cloud_Workspace_License');

	const cachedLicenseReturn = () => {
		const license = currentLicense?.value as string;
		if (license) {
			callbacks.run('workspaceLicenseChanged', license);
		}

		return { updated: false, license };
	};

	const token = await getWorkspaceAccessToken();
	if (!token) {
		return cachedLicenseReturn();
	}

	let licenseResult;
	try {
		licenseResult = HTTP.get(`${settings.get('Cloud_Workspace_Registration_Client_Uri')}/license?version=${LICENSE_VERSION}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to update license from Rocket.Chat Cloud',
			url: '/license',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		return cachedLicenseReturn();
	}

	const remoteLicense = licenseResult.data;

	if (!currentLicense || !currentLicense._updatedAt) {
		throw new Error('Failed to retrieve current license');
	}

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return cachedLicenseReturn();
	}

	await Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	callbacks.run('workspaceLicenseChanged', remoteLicense.license);

	return { updated: true, license: remoteLicense.license };
}
