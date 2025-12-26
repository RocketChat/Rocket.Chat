import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

export const useAppSchedulerJobs = ({ appId }: { appId: string }): UseQueryResult<OperationResult<'GET', '/apps/:id/scheduler-jobs'>> => {
	const schedulerJobs = useEndpoint('GET', '/apps/:id/scheduler-jobs', { id: appId });

	return useQuery({
		queryKey: ['marketplace', 'apps', appId, 'scheduler-jobs'],
		queryFn: () => schedulerJobs(),
	});
};
