import { NPS, Banner } from '@rocket.chat/core-services';
import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { CloudAnnouncements } from '@rocket.chat/models';

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

const deserializeAnnouncement = (announcement: Serialized<Cloud.Announcement>): Cloud.Announcement => ({
	...announcement,
	_updatedAt: new Date(announcement._updatedAt),
	expireAt: new Date(announcement.expireAt),
	startAt: new Date(announcement.startAt),
	createdAt: new Date(announcement.createdAt),
});

export const handleAnnouncementsOnWorkspaceSync = async (
	announcements: Exclude<Serialized<Cloud.WorkspaceCommsResponsePayload>['announcements'], undefined>,
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
