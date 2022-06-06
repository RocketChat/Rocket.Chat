import { useQuery } from 'react-query';

import { getFromRestApi } from '../../../../lib/getFromRestApi';
import { getPeriodRange, Period } from '../dataView/periods';

type UseMessagesSentOptions = { period: Period['key'] };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMessagesSent = ({ period }: UseMessagesSentOptions) =>
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
