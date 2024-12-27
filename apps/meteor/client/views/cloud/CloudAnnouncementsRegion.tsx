import { BannerPlatform } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

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
		refetchInterval: 1000 * 60 * 60 * 24,
	});

	const subscribeToNotifyLoggedIn = useStream('notify-logged');
	const subscribeToNotifyUser = useStream('notify-user');
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!uid) {
			return;
		}

		const unsubscribeFromBannerChanged = subscribeToNotifyLoggedIn('banner-changed', async () => {
			queryClient.invalidateQueries({
				queryKey: ['cloud', 'announcements'],
			});
		});

		const unsubscribeBanners = subscribeToNotifyUser(`${uid}/banners`, async () => {
			queryClient.invalidateQueries({
				queryKey: ['cloud', 'announcements'],
			});
		});

		return () => {
			unsubscribeFromBannerChanged();
			unsubscribeBanners();
		};
	}, [subscribeToNotifyLoggedIn, uid, subscribeToNotifyUser, queryClient]);

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
