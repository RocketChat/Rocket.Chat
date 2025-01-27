import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';

type UseWeeklyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useWeeklyChatActivity = ({ displacement, utc }: UseWeeklyChatActivityOptions) => {
	const getWeeklyChatActivity = useEndpoint('GET', '/v1/engagement-dashboard/users/chat-busier/weekly-data');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/weekly-chat-activity', { displacement, utc }],

		queryFn: async () => {
			const day = (utc ? moment.utc().endOf('day') : moment().endOf('day')).subtract(displacement, 'weeks').toDate();

			const response = await getWeeklyChatActivity({
				start: day.toISOString(),
			});

			return response
				? {
						...response,
						day,
					}
				: undefined;
		},

		refetchInterval: 5 * 60 * 1000,
		throwOnError: true,
	});
};
