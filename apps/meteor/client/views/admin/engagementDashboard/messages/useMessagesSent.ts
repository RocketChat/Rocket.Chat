import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseMessagesSentOptions = { period: Period['key']; utc: boolean };

type UseMessagesSentData = Awaited<ReturnType<ReturnType<typeof useEndpoint<'GET', '/v1/engagement-dashboard/messages/messages-sent'>>>> & {
	start: Date;
	end: Date;
};

export const useMessagesSent = ({ period, utc }: UseMessagesSentOptions): UseQueryResult<UseMessagesSentData | undefined, Error> => {
	const getMessagesSent = useEndpoint('GET', '/v1/engagement-dashboard/messages/messages-sent');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/messages/messages-sent', { period, utc }],

		queryFn: async () => {
			const { start, end } = getPeriodRange(period, utc);

			const response = await getMessagesSent({
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

		refetchInterval: 5 * 60 * 1000,
		throwOnError: true,
	});
};
