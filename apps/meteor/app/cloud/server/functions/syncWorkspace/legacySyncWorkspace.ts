import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { notifyOnSettingChangedById } from '../../../../lib/server/lib/notifyListener';
import { settings } from '../../../../settings/server';
import type { WorkspaceRegistrationData } from '../buildRegistrationData';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { getWorkspaceLicense } from '../getWorkspaceLicense';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { handleBannerOnWorkspaceSync, handleNpsOnWorkspaceSync } from './handleCommsSync';

const workspaceClientPayloadSchema = z.object({
	workspaceId: z.string(),
	publicKey: z.string().optional(),
	trial: z
		.object({
			trialing: z.boolean(),
			trialID: z.string(),
			endDate: z.string().datetime(),
			marketing: z.object({
				utmContent: z.string(),
				utmMedium: z.string(),
				utmSource: z.string(),
				utmCampaign: z.string(),
			}),
			DowngradesToPlan: z.object({
				id: z.string(),
			}),
			trialRequested: z.boolean(),
		})
		.optional(),
	nps: z.object({
		id: z.string(),
		startAt: z.string().datetime(),
		expireAt: z.string().datetime(),
	}),
	banners: z.array(
		z.object({
			_id: z.string(),
			_updatedAt: z.string().datetime(),
			platform: z.array(z.string()),
			expireAt: z.string().datetime(),
			startAt: z.string().datetime(),
			roles: z.array(z.string()).optional(),
			createdBy: z.object({
				_id: z.string(),
				username: z.string().optional(),
			}),
			createdAt: z.string().datetime(),
			view: z.any(),
			active: z.boolean().optional(),
			inactivedAt: z.string().datetime().optional(),
			snapshot: z.string().optional(),
		}),
	),
	announcements: z.object({
		create: z.array(
			z.object({
				_id: z.string(),
				_updatedAt: z.string().datetime(),
				selector: z.object({
					roles: z.array(z.string()),
				}),
				platform: z.array(z.enum(['web', 'mobile'])),
				expireAt: z.string().datetime(),
				startAt: z.string().datetime(),
				createdBy: z.enum(['cloud', 'system']),
				createdAt: z.string().datetime(),
				dictionary: z.record(z.record(z.string())),
				view: z.any(),
				surface: z.enum(['banner', 'modal']),
			}),
		),
		delete: z.array(z.string()),
	}),
});

/** @deprecated */
const fetchWorkspaceClientPayload = async ({
	token,
	workspaceRegistrationData,
}: {
	token: string;
	workspaceRegistrationData: WorkspaceRegistrationData<undefined>;
}): Promise<Serialized<Cloud.WorkspaceSyncPayload> | undefined> => {
	const workspaceRegistrationClientUri = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUri}/client`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: workspaceRegistrationData,
		timeout: 5000,
	});

	if (!response.ok) {
		try {
			const { error } = await response.json();
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
		} catch (error) {
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${response.statusText}`);
		}
	}

	const payload = await response.json();

	if (!payload) {
		return undefined;
	}

	const assertWorkspaceClientPayload = workspaceClientPayloadSchema.safeParse(payload);

	if (!assertWorkspaceClientPayload.success) {
		throw new CloudWorkspaceConnectionError('Invalid response from Rocket.Chat Cloud');
	}

	return payload;
};

/** @deprecated */
const consumeWorkspaceSyncPayload = async (result: Serialized<Cloud.WorkspaceSyncPayload>) => {
	if (result.publicKey) {
		(await Settings.updateValueById('Cloud_Workspace_PublicKey', result.publicKey)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_PublicKey');
	}

	if (result.trial?.trialID) {
		(await Settings.updateValueById('Cloud_Workspace_Had_Trial', true)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_Had_Trial');
	}

	// add banners
	if (result.banners) {
		await handleBannerOnWorkspaceSync(result.banners);
	}

	if (result.nps) {
		await handleNpsOnWorkspaceSync(result.nps);
	}
};

/** @deprecated */
export async function legacySyncWorkspace() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		throw new CloudWorkspaceRegistrationError('Workspace is not registered');
	}

	const token = await getWorkspaceAccessToken(true);
	if (!token) {
		throw new CloudWorkspaceAccessTokenEmptyError();
	}

	const workspaceRegistrationData = await buildWorkspaceRegistrationData(undefined);

	const payload = await fetchWorkspaceClientPayload({ token, workspaceRegistrationData });

	if (payload) {
		await consumeWorkspaceSyncPayload(payload);
	}

	await getWorkspaceLicense();

	return true;
}
