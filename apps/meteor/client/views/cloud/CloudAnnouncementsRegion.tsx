import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import CloudAnnouncementHandler from './CloudAnnouncementHandler';

const CloudAnnouncementsRegion = () => {
	const uid = useUserId();

	const getAnnouncements = useEndpoint('GET', '/v1/cloud.announcements');

	const { isSuccess, data: announcements } = useQuery({
		queryKey: ['cloud', 'announcements'],
		queryFn: () => getAnnouncements(),
		select: (data) => data.announcements,
		enabled: !!uid,
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
