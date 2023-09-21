import { NPS, Banner } from '@rocket.chat/core-services';
import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { CloudWorkspaceConnectionError } from '../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../lib/errors/CloudWorkspaceRegistrationError';
import { CloudWorkspaceSyncError } from '../../../../lib/errors/CloudWorkspaceSyncError';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { getAndCreateNpsSurvey } from '../../../../server/services/nps/getAndCreateNpsSurvey';
import { settings } from '../../../settings/server';
import { buildWorkspaceRegistrationData } from './buildRegistrationData';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { getWorkspaceLicense } from './getWorkspaceLicense';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

const cloudSyncPayloadSchema = v.object({
	workspaceId: v.string().required(),
	publicKey: v.string(),
	trial: v.object({
		trialing: v.boolean().required(),
		trialID: v.string().required(),
		endDate: v.string().required(),
		marketing: v
			.object({
				utmContent: v.string().required(),
				utmMedium: v.string().required(),
				utmSource: v.string().required(),
				utmCampaign: v.string().required(),
			})
			.required(),
		DowngradesToPlan: v
			.object({
				id: v.string().required(),
			})
			.required(),
		trialRequested: v.boolean().required(),
	}),
	nps: v.object({
		id: v.string().required(),
		startAt: v.string().required(),
		expireAt: v.string().required(),
	}),
	banners: v.array(
		v.object({
			_id: v.string().required(),
			_updatedAt: v.string().required(),
			platform: v.array(v.string()).required(),
			expireAt: v.string().required(),
			startAt: v.string().required(),
			roles: v.array(v.string()),
			createdBy: v.object({
				_id: v.string().required(),
				username: v.string(),
			}),
			createdAt: v.string().required(),
			view: v.any(),
			active: v.boolean(),
			inactivedAt: v.string(),
			snapshot: v.string(),
		}),
	),
	announcements: v.object({
		create: v.array(
			v.object({
				_id: v.string().required(),
				_updatedAt: v.string().required(),
				selector: v.object({
					roles: v.array(v.string()),
				}),
				platform: v.array(v.string().enum('web', 'mobile')).required(),
				expireAt: v.string().required(),
				startAt: v.string().required(),
				createdBy: v.string().enum('cloud', 'system').required(),
				createdAt: v.string().required(),
				dictionary: v.object({}).additional(v.object({}).additional(v.string())),
				view: v.any(),
				surface: v.string().enum('banner', 'modal').required(),
			}),
		),
		delete: v.array(v.string()),
	}),
});

const assertCloudSyncPayload = compile(cloudSyncPayloadSchema);

const fetchSyncPayload = async (): Promise<Serialized<Cloud.SyncPayload> | undefined> => {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		throw new CloudWorkspaceRegistrationError('Workspace is not registered');
	}

	const token = await getWorkspaceAccessToken(true);
	if (!token) {
		throw new CloudWorkspaceConnectionError('Workspace does not have a valid access token');
	}

	const info = await buildWorkspaceRegistrationData(undefined);
	const workspaceRegistrationClientUrl = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUrl}/client`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: info,
	});

	if (!response.ok) {
		throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${response.statusText}`);
	}

	const payload = await response.json();

	if (!payload) {
		// TODO: check if empty payload really means there is nothing to sync
		return undefined;
	}

	if (!response.ok) {
		throw new CloudWorkspaceSyncError(payload.error);
	}

	assertCloudSyncPayload(payload);

	return payload;
};

const consumeSyncPayload = async (result: Serialized<Cloud.SyncPayload>) => {
	if (result.publicKey) {
		await Settings.updateValueById('Cloud_Workspace_PublicKey', result.publicKey);
	}

	if (result.trial?.trialID) {
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
};

export async function syncWorkspace() {
	try {
		const payload = await fetchSyncPayload();

		if (!payload) {
			// TODO: check if empty payload really means there is nothing to sync
			return true;
		}

		await consumeSyncPayload(payload);

		return true;
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to sync with Rocket.Chat Cloud',
			url: '/client',
			err,
		});

		return false;
	} finally {
		await getWorkspaceLicense();
	}
}
