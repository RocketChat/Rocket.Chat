import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { callbacks } from '../../../../lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { LICENSE_VERSION } from '../license';
import { generateWorkspaceBearerHttpHeaderOrThrow } from './getWorkspaceAccessToken';
import { handleResponse } from './supportedVersionsToken/supportedVersionsToken';

export async function getWorkspaceLicense() {
	const token = await generateWorkspaceBearerHttpHeaderOrThrow();

	const currentLicense = await Settings.findOne('Cloud_Workspace_License');

	// TODO: check if this is the correct way to handle this
	// If there is no license, in theory, it should be a new workspace non registered
	// in this case the `generateWorkspaceBearerHttpHeaderOrThrow` show throw an error before
	// so in theory, this should never happen
	if (!currentLicense?._updatedAt) {
		throw new Error('Failed to retrieve current license');
	}

	const request = await handleResponse(
		fetch(`${settings.get('Cloud_Workspace_Registration_Client_Uri')}/license`, {
			headers: {
				...token,
			},
			params: {
				version: LICENSE_VERSION,
			},
		}),
	);

	if (!request.success) {
		SystemLogger.error({
			msg: 'Failed to update license from Rocket.Chat Cloud',
			url: '/license',
			err: request.error,
		});
		if (currentLicense.value) {
			return callbacks.run('workspaceLicenseChanged', currentLicense.value);
		}
		return;
	}

	const remoteLicense = request.result as any;

	if (remoteLicense.updatedAt <= currentLicense._updatedAt) {
		return callbacks.run('workspaceLicenseChanged', currentLicense.value);
	}

	await Settings.updateValueById('Cloud_Workspace_License', remoteLicense.license);

	await callbacks.run('workspaceLicenseChanged', remoteLicense.license);
}
