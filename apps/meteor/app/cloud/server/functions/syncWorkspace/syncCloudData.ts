import { NPS, Banner } from '@rocket.chat/core-services';
import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { CloudAnnouncements, Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { CloudWorkspaceAccessError } from '../../../../../lib/errors/CloudWorkspaceAccessError';
import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { getAndCreateNpsSurvey } from '../../../../../server/services/nps/getAndCreateNpsSurvey';
import { settings } from '../../../../settings/server';
import type { WorkspaceRegistrationData } from '../buildRegistrationData';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { getWorkspaceLicense } from '../getWorkspaceLicense';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';

const workspaceSyncPayloadSchema = v.object({
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

const assertWorkspaceSyncPayload = compile(workspaceSyncPayloadSchema);

const fetchWorkspaceSyncPayload = async ({
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

	assertWorkspaceSyncPayload(payload);

	return payload;
};

const handleNpsOnWorkspaceSync = async (nps: Exclude<Serialized<Cloud.WorkspaceSyncPayload>['nps'], undefined>) => {
	const { id: npsId, expireAt } = nps;

	const startAt = new Date(nps.startAt);

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
};

const handleBannerOnWorkspaceSync = async (banners: Exclude<Serialized<Cloud.WorkspaceSyncPayload>['banners'], undefined>) => {
	for await (const banner of banners) {
		const { createdAt, expireAt, startAt, inactivedAt, _updatedAt, ...rest } = banner;

		await Banner.create({
			...rest,
			createdAt: new Date(createdAt),
			expireAt: new Date(expireAt),
			startAt: new Date(startAt),
			...(inactivedAt && { inactivedAt: new Date(inactivedAt) }),
		});
	}
};

const deserializeAnnouncement = (announcement: Serialized<Cloud.Announcement>): Cloud.Announcement => ({
	...announcement,
	_updatedAt: new Date(announcement._updatedAt),
	expireAt: new Date(announcement.expireAt),
	startAt: new Date(announcement.startAt),
	createdAt: new Date(announcement.createdAt),
});

const handleAnnouncementsOnWorkspaceSync = async (
	announcements: Exclude<Serialized<Cloud.WorkspaceSyncPayload>['announcements'], undefined>,
) => {
	const { create, delete: deleteIds } = announcements;

	if (deleteIds) {
		await CloudAnnouncements.deleteMany({ _id: { $in: deleteIds } });
	}

	for await (const announcement of create.map(deserializeAnnouncement)) {
		const { _id, ...rest } = announcement;

		await CloudAnnouncements.updateOne({ _id }, { $set: rest }, { upsert: true });
	}
};

const consumeWorkspaceSyncPayload = async (result: Serialized<Cloud.WorkspaceSyncPayload>) => {
	if (result.publicKey) {
		await Settings.updateValueById('Cloud_Workspace_PublicKey', result.publicKey);
	}

	if (result.trial?.trialID) {
		await Settings.updateValueById('Cloud_Workspace_Had_Trial', true);
	}

	if (result.nps) {
		await handleNpsOnWorkspaceSync(result.nps);
	}

	// add banners
	if (result.banners) {
		await handleBannerOnWorkspaceSync(result.banners);
	}

	if (result.announcements) {
		await handleAnnouncementsOnWorkspaceSync(result.announcements);
	}
};

export async function syncCloudData() {
	try {
		const { workspaceRegistered } = await retrieveRegistrationStatus();
		if (!workspaceRegistered) {
			throw new CloudWorkspaceRegistrationError('Workspace is not registered');
		}

		const token = await getWorkspaceAccessToken(true);
		if (!token) {
			throw new CloudWorkspaceAccessError('Workspace does not have a valid access token');
		}

		const workspaceRegistrationData = await buildWorkspaceRegistrationData(undefined);

		const payload = await fetchWorkspaceSyncPayload({ token, workspaceRegistrationData });

		if (!payload) {
			return true;
		}

		await consumeWorkspaceSyncPayload(payload);

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
