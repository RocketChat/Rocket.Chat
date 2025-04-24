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
				count: options.limit ?? 25,
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
	});
};
