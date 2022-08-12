import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getPeriodRange, Period } from '../dataView/periods';

type UseMessageOriginsOptions = { period: Period['key'] };

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMessageOrigins = ({ period }: UseMessageOriginsOptions) => {
	const getMessageOrigins = useEndpoint('GET', '/v1/engagement-dashboard/messages/origin');

	return useQuery(
		['admin/engagement-dashboard/messages/origins', { period }],
		async () => {
			const { start, end } = getPeriodRange(period);

			const response = await getMessageOrigins({
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
};
