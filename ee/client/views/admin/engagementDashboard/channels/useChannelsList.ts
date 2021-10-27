import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../utils/periods';

export const useChannelsList = ({
	period,
	offset,
	count,
}: {
	period: Period['key'];
	offset: number;
	count: number;
}) => {
	const fetchChannelsList = async () => {
		const { start, end } = getPeriodRange(period);

		const response = await getFromRestApi('/v1/engagement-dashboard/channels/list')({
			start: start.toISOString(),
			end: end.toISOString(),
			offset,
			count,
		});

		return response
			? {
					...response,
					start,
					end,
			  }
			: undefined;
	};

	return useQuery(
		['admin/engagement-dashboard/channels/list', { period, offset, count }],
		fetchChannelsList,
		{
			keepPreviousData: true,
			refetchInterval: 5 * 60 * 1000,
		},
	);
};
