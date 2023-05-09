import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { LICENSE_VERSION } from '../license';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getWorkspaceLicense(): Promise<{ updated: boolean; license: string }> {
	const currentLicense = await Settings.findOne('Cloud_Workspace_License');

	const cachedLicenseReturn = async () => {
		const license = currentLicense?.value as string;
		if (license) {
			await callbacks.run('workspaceLicenseChanged', license);
		}

		return { updated: false, license };
	};

	const token = await getWorkspaceAccessToken();
	if (!token) {
		return cachedLicenseReturn();
	}

	let licenseResult;
	try {
		const request = await fetch(`${settings.get('Cloud_Workspace_Registration_Client_Uri')}/license`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: {
				version: LICENSE_VERSION,
			},
		});

		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		licenseResult = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to update license from Rocket.Chat Cloud',
			url: '/license',
			err,
		});

		return cachedLicenseReturn();
	}

	const remoteLicense = licenseResult;

	if (!currentLicense || !currentLicense._updatedAt) {
		throw new Error('Failed to retrieve current license');
	}

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return cachedLicenseReturn();
	}

	await Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	await callbacks.run('workspaceLicenseChanged', remoteLicense.license);

	return { updated: true, license: remoteLicense.license };
}
