import { NPS, Banner } from '@rocket.chat/core-services';
import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { getAndCreateNpsSurvey } from '../../../../server/services/nps/getAndCreateNpsSurvey';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function syncWorkspace(_reconnectCheck = false) {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return false;
	}

	const info = await buildWorkspaceRegistrationData(undefined);

	let result: Serialized<Cloud.SyncPayload>;

	try {
		const token = await getWorkspaceAccessToken(true);

		if (!token) {
			return false;
		}

		const workspaceRegistrationClientUrl = settings.get('Cloud_Workspace_Registration_Client_Uri');
		const response = await fetch(`${workspaceRegistrationClientUrl}/client`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: info,
		});

		const payload = await response.json();

		if (!payload) {
			return true;
		}

		if (!response.ok) {
			throw new Error(payload.error);
		}

		result = payload;
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

	if (result.publicKey) {
		await Settings.updateValueById('Cloud_Workspace_PublicKey', result.publicKey);
	}

	if (result.trial?.trialId) {
		await Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
	}

	if (result.nps) {
		const { id: npsId, expireAt } = result.nps;

		const startAt = new Date(result.nps.startAt);

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
	if (result.banners) {
		for await (const banner of result.banners) {
			const { createdAt, expireAt, startAt, inactivedAt, _updatedAt, ...rest } = banner;

			await Banner.create({
				...rest,
				createdAt: new Date(createdAt),
				expireAt: new Date(expireAt),
				startAt: new Date(startAt),
				...(inactivedAt && { inactivedAt: new Date(inactivedAt) }),
			});
		}
	}

	return true;
}
