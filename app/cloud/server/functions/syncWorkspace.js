import { HTTP } from 'meteor/http';

import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { Settings } from '../../../models';
import { settings } from '../../../settings';
import { NPS, Banner } from '../../../../server/sdk';

export function syncWorkspace(reconnectCheck = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if (!workspaceRegistered || (!connectToCloud && !reconnectCheck)) {
		return false;
	}

	const info = buildWorkspaceRegistrationData();

	const workspaceUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');

	let result;
	try {
		const headers = {};
		const token = getWorkspaceAccessToken(true);

		if (token) {
			headers.Authorization = `Bearer ${ token }`;
		} else {
			return false;
		}

		result = HTTP.post(`${ workspaceUrl }/client`, {
			data: info,
			headers,
		});

		getWorkspaceLicense();
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to sync with Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);
		} else {
			console.error(e);
		}

		return false;
	}

	const { data } = result;
	if (!data) {
		return true;
	}

	if (data.publicKey) {
		Settings.updateValueById('Cloud_Workspace_PublicKey', data.publicKey);
	}

	if (data.nps) {
		const {
			id: npsId,
			startAt,
			expireAt,
		} = data.nps;

		Promise.await(NPS.create({
			npsId,
			startAt: new Date(startAt),
			expireAt: new Date(expireAt),
		}));
	}

	// add banners
	if (data.banners) {
		for (const banner of data.banners) {
			const {
				createdAt,
				expireAt,
				startAt,
			} = banner;

			Promise.await(Banner.create({
				...banner,
				createdAt: new Date(createdAt),
				expireAt: new Date(expireAt),
				startAt: new Date(startAt),
			}));
		}
	}

	return true;
}
