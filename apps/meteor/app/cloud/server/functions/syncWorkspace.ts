import { NPS, Banner } from '@rocket.chat/core-services';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { getAndCreateNpsSurvey } from '../../../../server/services/nps/getAndCreateNpsSurvey';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { generateWorkspaceBearerHttpHeader } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getCachedSupportedVersionsToken } from './supportedVersionsToken/supportedVersionsToken';

/**
 * Rocket.Chat Cloud Sync Procedure
 * It does not matter if you are registered with Rocket.Chat Cloud:
 *	- Sends Statistics to Rocket.Chat Cloud
 * If you are registered with Rocket.Chat Cloud
 *	- Communicates with Rocket.Chat Cloud to update valuable information
 *		- Receives NPS Survey from Rocket.Chat Cloud if applicable
 *		- Receives Banners from Rocket.Chat Cloud if applicable
 *		- Receives License from Rocket.Chat Cloud if applicable
 *	- Receives a new List of Supported Versions from Rocket.Chat Cloud
 */

export async function syncWorkspace(_reconnectCheck = false) {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return false;
	}

	const info = await buildWorkspaceRegistrationData(undefined);

	const workspaceUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');

	const token = await generateWorkspaceBearerHttpHeader(true);

	let result;
	try {
		if (!token) {
			return false;
		}

		const request = await fetch(`${workspaceUrl}/client`, {
			headers: {
				...token,
			},
			body: info,
			method: 'POST',
		});

		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();

		const data = result;
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
				await getAndCreateNpsSurvey(npsId);
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
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to sync with Rocket.Chat Cloud',
			url: '/client',
			err,
		});

		return false;
	} finally {
		// aways fetch the license
		await getWorkspaceLicense();
	}

	await getCachedSupportedVersionsToken.reset();
	return true;
}
