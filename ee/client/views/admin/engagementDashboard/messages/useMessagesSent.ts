import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../utils/periods';

export const useMessagesSent = ({ period }: { period: Period['key'] }) =>
	useQuery(
		['admin/engagement-dashboard/messages/messages-sent', { period }],
		async () => {
			const { start, end } = getPeriodRange(period);

			const response = await getFromRestApi('/v1/engagement-dashboard/messages/messages-sent')({
				start: start.toISOString(),
				end: end.toISOString(),
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
			refetchInterval: 5 * 60 * 1000,
		},
	);
