import type { Serialized, ILivechatMonitor } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

type MonitorsListOptions = {
	filter: string;
	limit?: number;
};

type MonitorListItem = {
	_id: string;
	label: string;
	value: string;
};

const DEFAULT_QUERY_LIMIT = 25;

export const useInfiniteMonitorsList = (options: MonitorsListOptions) => {
	const getMonitors = useEndpoint('GET', '/v1/livechat/monitors');

	const formatMonitorItem = (monitor: Serialized<ILivechatMonitor>): MonitorListItem => ({
		_id: monitor._id,
		label: monitor.username,
		value: monitor._id,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/monitors', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { monitors, ...data } = await getMonitors({
				text: options.filter,
				offset,
				count: options.limit ?? DEFAULT_QUERY_LIMIT,
				sort: JSON.stringify({ username: 1 }),
			});

			return {
				...data,
				monitors: monitors.map(formatMonitorItem),
			};
		},
		select: (data) => data.pages.flatMap<MonitorListItem>((page) => page.monitors),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ monitors: [], total: 0, offset: 0, count: options.limit ?? DEFAULT_QUERY_LIMIT }],
			pageParams: [0],
		}),
	});
};
