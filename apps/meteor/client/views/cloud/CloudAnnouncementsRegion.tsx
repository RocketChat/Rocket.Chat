import { BannerPlatform } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import CloudAnnouncementHandler from './CloudAnnouncementHandler';

const CloudAnnouncementsRegion = () => {
	const uid = useUserId();

	const getAnnouncements = useEndpoint('GET', '/v1/banners');

	const { isSuccess, data: announcements } = useQuery({
		queryKey: ['cloud', 'announcements'],
		queryFn: () => getAnnouncements({ platform: BannerPlatform.Web }),
		select: (data) => data.banners,
		enabled: !!uid,
		staleTime: 0,
		refetchInterval: 1000 * 60 * 5,
	});

	if (!isSuccess) {
		return null;
	}

	return (
		<>
			{announcements.map((announcement) => (
				<CloudAnnouncementHandler key={announcement._id} {...announcement} />
			))}
		</>
	);
};

export default CloudAnnouncementsRegion;
