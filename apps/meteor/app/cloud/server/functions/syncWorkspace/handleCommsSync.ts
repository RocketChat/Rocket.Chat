import { NPS, Banner } from '@rocket.chat/core-services';
import type { Cloud, Serialized } from '@rocket.chat/core-typings';

import { getAndCreateNpsSurvey } from '../../../../../server/services/nps/getAndCreateNpsSurvey';

export const handleNpsOnWorkspaceSync = async (nps: Exclude<Serialized<Cloud.WorkspaceSyncPayload>['nps'], undefined>) => {
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

export const handleBannerOnWorkspaceSync = async (banners: Exclude<Serialized<Cloud.WorkspaceSyncPayload>['banners'], undefined>) => {
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

const deserializeAnnouncement = (announcement: Serialized<Cloud.Announcement>): Cloud.Announcement => {
	const { inactivedAt, _updatedAt, expireAt, startAt, createdAt } = announcement;

	return {
		...announcement,
		_updatedAt: new Date(_updatedAt),
		expireAt: new Date(expireAt),
		startAt: new Date(startAt),
		createdAt: new Date(createdAt),
		inactivedAt: inactivedAt ? new Date(inactivedAt) : undefined,
	};
};

export const handleAnnouncementsOnWorkspaceSync = async (
	announcements: Exclude<Serialized<Cloud.WorkspaceCommsResponsePayload>['announcements'], undefined>,
) => {
	const { create, delete: deleteIds } = announcements;

	if (deleteIds) {
		await Promise.all(deleteIds.map((bannerId) => Banner.disable(bannerId)));
	}

	await Promise.all(
		create.map(deserializeAnnouncement).map((announcement) => {
			const { view, selector } = announcement;

			return Banner.create({
				...announcement,
				...(selector?.roles ? { roles: selector.roles } : {}),
				view: {
					...view,
					appId: 'cloud-announcements-core',
				},
			});
		}),
	);
};
