import { useQuery } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import type ContactInfoActivityItem from './ActivityListItem';

export const useActivityList = () => {
	// const getActivities = useEndpoint('GET', '/v1/omnichannel/activities');
	return useQuery<ComponentProps<typeof ContactInfoActivityItem>[]>({
		queryKey: ['/v1/omnichannel/activities'],
		queryFn: () =>
			new Promise((res) =>
				setTimeout(
					() =>
						res([
							{ name: 'Haylie George', status: { id: 'sent', ts: new Date().toISOString() } },
							{ name: 'Haylie George', status: { id: 'sent', ts: new Date().toISOString() } },
						]),
					2000,
				),
			),
	});
};
