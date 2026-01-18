import { NPS, Banner } from '@rocket.chat/core-services';
import type { Cloud, IBanner } from '@rocket.chat/core-typings';

import { getAndCreateNpsSurvey } from '../../../../../server/services/nps/getAndCreateNpsSurvey';

export const handleNpsOnWorkspaceSync = async (nps: Cloud.NpsSurveyAnnouncement) => {
	const { id: npsId, startAt, expireAt } = nps;

	await NPS.create({
		npsId,
		startAt,
		expireAt,
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

export const handleBannerOnWorkspaceSync = async (banners: IBanner[]) => {
	for await (const banner of banners) {
		await Banner.create(banner);
	}
};

export const handleAnnouncementsOnWorkspaceSync = async (announcements: {
	create: Cloud.Announcement[];
	delete?: Cloud.Announcement['_id'][];
}) => {
	const { create, delete: deleteIds } = announcements;

	if (deleteIds) {
		await Promise.all(deleteIds.map((announcementId) => Banner.disable(announcementId)));
	}

	await Promise.all(
		create.map((announcement) => {
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
