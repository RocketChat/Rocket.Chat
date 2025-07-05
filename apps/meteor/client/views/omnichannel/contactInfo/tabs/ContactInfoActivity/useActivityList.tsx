import { useQuery } from '@tanstack/react-query';

import { mockActivityList } from './mocks';

type ActivityStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type ActivityItem = {
	id: string;
	name: string;
	status: { id: ActivityStatus; ts: string };
};

export const useActivityList = () => {
	// const getActivities = useEndpoint('GET', '/v1/omnichannel/activities');
	return useQuery<ActivityItem[]>({
		queryKey: ['/v1/omnichannel/activities'],
		queryFn: () => new Promise((res) => setTimeout(() => res(mockActivityList), 2000)),
	});
};
