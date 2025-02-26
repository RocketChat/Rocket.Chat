import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import type { Period } from '../../../../components/dashboards/periods';
import { getPeriodRange } from '../../../../components/dashboards/periods';

type UseMessagesSentOptions = { period: Period['key'] };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMessagesSent = ({ period }: UseMessagesSentOptions) => {
	const getMessagesSent = useEndpoint('GET', '/v1/engagement-dashboard/messages/messages-sent');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/messages/messages-sent', { period }],

		queryFn: async () => {
			const { start, end } = getPeriodRange(period);

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
