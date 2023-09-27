import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useCloudAnnouncementsQuery = <TError = unknown, TData = Serialized<Cloud.Announcement>[]>(
	options?: UseQueryOptions<Serialized<Cloud.Announcement>[], TError, TData, readonly ['cloud', 'announcements']>,
) => {
	const getCloudAnnouncements = useEndpoint('GET', '/v1/cloud.announcements');

	return useQuery(
		['cloud', 'announcements'] as const,
		async () => {
			const { announcements } = await getCloudAnnouncements({ platform: 'web' });
			return announcements;
		},
		options,
	);
};
