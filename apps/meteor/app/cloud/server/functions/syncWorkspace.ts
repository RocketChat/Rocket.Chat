/* eslint-disable new-cap */
import { NPS, Banner } from '@rocket.chat/core-services';
import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Type } from '@sinclair/typebox';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

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

const ajv = addFormats(new Ajv({}), [
	'date-time',
	'time',
	'date',
	'email',
	'hostname',
	'ipv4',
	'ipv6',
	'uri',
	'uri-reference',
	'uuid',
	'uri-template',
	'json-pointer',
	'relative-json-pointer',
	'regex',
]);

const isCloudSyncPayload = ajv.compile<Serialized<Cloud.SyncPayload>>(
	Type.Object({
		workspaceId: Type.String(),
		publicKey: Type.Optional(Type.String()),
		trial: Type.Optional(
			Type.Object({
				trialing: Type.Boolean(),
				trialID: Type.String(),
				endDate: Type.String({ format: 'date-time' }),
				marketing: Type.Object({
					utmContent: Type.String(),
					utmMedium: Type.String(),
					utmSource: Type.String(),
					utmCampaign: Type.String(),
				}),
				DowngradesToPlan: Type.Object({
					id: Type.String(),
				}),
				trialRequested: Type.Boolean(),
			}),
		),
		nps: Type.Optional(
			Type.Object({
				id: Type.String(),
				startAt: Type.String({ format: 'date-time' }),
				expireAt: Type.String({ format: 'date-time' }),
			}),
		),
		banners: Type.Optional(
			Type.Array(
				Type.Object({
					_id: Type.String(),
					_updatedAt: Type.String({ format: 'date-time' }),
					platform: Type.Array(Type.Union([Type.Literal('web'), Type.Literal('mobile')])),
					expireAt: Type.String({ format: 'date-time' }),
					startAt: Type.String({ format: 'date-time' }),
					roles: Type.Optional(Type.Array(Type.String())),
					createdBy: Type.Object({
						_id: Type.String(),
						username: Type.Optional(Type.String()),
					}),
					createdAt: Type.String({ format: 'date-time' }),
					view: Type.Object(Type.Any()),
					active: Type.Optional(Type.Boolean()),
					inactivedAt: Type.Optional(Type.String({ format: 'date-time' })),
					snapshot: Type.Optional(Type.String()),
				}),
			),
		),
		announcements: Type.Optional(
			Type.Object({
				create: Type.Array(
					Type.Object({
						_id: Type.String(),
						_updatedAt: Type.String({ format: 'date-time' }),
						selector: Type.Optional(
							Type.Object({
								roles: Type.Optional(Type.Array(Type.String())),
							}),
						),
						platform: Type.Array(Type.Union([Type.Literal('web'), Type.Literal('mobile')])),
						expireAt: Type.String({ format: 'date-time' }),
						startAt: Type.String({ format: 'date-time' }),
						createdBy: Type.Union([Type.Literal('cloud'), Type.Literal('system')]),
						createdAt: Type.String({ format: 'date-time' }),
						dictionary: Type.Optional(Type.Record(Type.String(), Type.Record(Type.String(), Type.String()))),
						view: Type.Object(Type.Any()),
						surface: Type.Union([Type.Literal('banner'), Type.Literal('modal')]),
					}),
				),
				delete: Type.Array(Type.String()),
			}),
		),
	}),
);

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

	if (!isCloudSyncPayload(payload)) {
		throw new CloudWorkspaceSyncError(
			`Invalid payload received from Rocket.Chat Cloud: ${isCloudSyncPayload.errors?.map((err) => err.message).join('; ')}`,
		);
	}

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
