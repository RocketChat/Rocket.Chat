import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../dataView/periods';

type UseChannelsListOptions = {
	period: Period['key'];
	offset: number;
	count: number;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useChannelsList = ({ period, offset, count }: UseChannelsListOptions) =>
	useQuery(
		['admin/engagement-dashboard/channels/list', { period, offset, count }],
		async () => {
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
		},
		{
			keepPreviousData: true,
			refetchInterval: 5 * 60 * 1000,
		},
	);
