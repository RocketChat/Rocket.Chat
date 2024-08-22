import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

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

const workspaceClientPayloadSchema = v.object({
	workspaceId: v.string().required(),
	publicKey: v.string(),
	trial: v.object({
		trialing: v.boolean().required(),
		trialID: v.string().required(),
		endDate: v.string().format('date-time').required(),
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
		startAt: v.string().format('date-time').required(),
		expireAt: v.string().format('date-time').required(),
	}),
	banners: v.array(
		v.object({
			_id: v.string().required(),
			_updatedAt: v.string().format('date-time').required(),
			platform: v.array(v.string()).required(),
			expireAt: v.string().format('date-time').required(),
			startAt: v.string().format('date-time').required(),
			roles: v.array(v.string()),
			createdBy: v.object({
				_id: v.string().required(),
				username: v.string(),
			}),
			createdAt: v.string().format('date-time').required(),
			view: v.any(),
			active: v.boolean(),
			inactivedAt: v.string().format('date-time'),
			snapshot: v.string(),
		}),
	),
	announcements: v.object({
		create: v.array(
			v.object({
				_id: v.string().required(),
				_updatedAt: v.string().format('date-time').required(),
				selector: v.object({
					roles: v.array(v.string()),
				}),
				platform: v.array(v.string().enum('web', 'mobile')).required(),
				expireAt: v.string().format('date-time').required(),
				startAt: v.string().format('date-time').required(),
				createdBy: v.string().enum('cloud', 'system').required(),
				createdAt: v.string().format('date-time').required(),
				dictionary: v.object({}).additional(v.object({}).additional(v.string())),
				view: v.any(),
				surface: v.string().enum('banner', 'modal').required(),
			}),
		),
		delete: v.array(v.string()),
	}),
});

const assertWorkspaceClientPayload = compile(workspaceClientPayloadSchema);

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

	if (!assertWorkspaceClientPayload(payload)) {
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
