import { NPS, Banner } from '@rocket.chat/core-services';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../../server/lib/logger/system';
import { getAndCreateNpsSurvey } from '../../../../../server/services/nps/getAndCreateNpsSurvey';
import { settings } from '../../../../settings/server';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { generateWorkspaceBearerHttpHeaderOrThrow } from '../getWorkspaceAccessToken';
import { handleResponse } from '../supportedVersionsToken/supportedVersionsToken';

export async function syncCloudData() {
	const info = await buildWorkspaceRegistrationData(undefined);

	const token = await generateWorkspaceBearerHttpHeaderOrThrow(true);

	const request = await handleResponse(
		fetch(`${settings.get('Cloud_Workspace_Registration_Client_Uri')}/client`, {
			headers: {
				...token,
			},
			body: info,
			method: 'POST',
		}),
	);

	if (!request.success) {
		return SystemLogger.error({
			msg: 'Failed to sync with Rocket.Chat Cloud',
			url: '/client',
			err: request.error,
		});
	}

	const data = request.result as any;
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

	return true;
}
