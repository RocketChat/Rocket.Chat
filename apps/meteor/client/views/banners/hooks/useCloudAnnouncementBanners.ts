import type { Serialized, Cloud, UiKitBannerPayload } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { useCloudAnnouncementsQuery } from '../../../hooks/useCloudAnnouncementsQuery';
import * as banners from '../../../lib/banners';

const isBannerCarryingAnnouncement = (
	announcement: Serialized<Cloud.Announcement>,
): announcement is Serialized<Cloud.Announcement> & { surface: 'banner'; view: UiKitBannerPayload } => announcement.surface === 'banner';

export const useCloudAnnouncementBanners = () => {
	const queryResult = useCloudAnnouncementsQuery({
		select: (announcements) => announcements.filter(isBannerCarryingAnnouncement),
	});

	useEffect(() => {
		if (!queryResult.isSuccess) {
			return;
		}

		for (const announcement of queryResult.data) {
			banners.open(announcement.view);
		}

		return () => {
			for (const announcement of queryResult.data) {
				banners.closeById(announcement.view.viewId);
			}
		};
	}, [queryResult.data, queryResult.isSuccess]);
};
