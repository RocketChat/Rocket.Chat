import { HTTP } from 'meteor/http';
import { Settings } from '@rocket.chat/models';

import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { settings } from '../../../settings/server';
import { getAndCreateNpsSurvey } from '../../../../server/services/nps/getAndCreateNpsSurvey';
import { NPS, Banner } from '../../../../server/sdk';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function syncWorkspace(reconnectCheck = false) {
	const { workspaceRegistered, connectToCloud } = retrieveRegistrationStatus();
	if (!workspaceRegistered || (!connectToCloud && !reconnectCheck)) {
		return false;
	}

	const info = await buildWorkspaceRegistrationData(undefined);

	const workspaceUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');

	let result;
	try {
		const headers: Record<string, string> = {};
		const token = await getWorkspaceAccessToken(true);

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		} else {
			return false;
		}

		result = HTTP.post(`${workspaceUrl}/client`, {
			data: info,
			headers,
		});

		await getWorkspaceLicense();
	} catch (e: any) {
		if (e.response?.data?.error) {
			SystemLogger.error(`Failed to sync with Rocket.Chat Cloud.  Error: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
		}

		return false;
	}

	const { data } = result;
	if (!data) {
		return true;
	}

	if (data.publicKey) {
		await Settings.updateValueById('Cloud_Workspace_PublicKey', data.publicKey);
	}

	if (data.trial?.trialId) {
		await Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
	}

	if (data.nps) {
		const { id: npsId, expireAt } = data.nps;

		const startAt = new Date(data.nps.startAt);

		await NPS.create({
			npsId,
			startAt,
			expireAt: new Date(expireAt),
			createdBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
		});

		const now = new Date();

		if (startAt.getFullYear() === now.getFullYear() && startAt.getMonth() === now.getMonth() && startAt.getDate() === now.getDate()) {
			getAndCreateNpsSurvey(npsId);
		}
	}

	// add banners
	if (data.banners) {
		for await (const banner of data.banners) {
			const { createdAt, expireAt, startAt } = banner;

			await Banner.create({
				...banner,
				createdAt: new Date(createdAt),
				expireAt: new Date(expireAt),
				startAt: new Date(startAt),
			});
		}
	}

	return true;
}
