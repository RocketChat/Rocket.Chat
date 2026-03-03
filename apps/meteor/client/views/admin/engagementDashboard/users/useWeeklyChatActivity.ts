import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, subWeeks } from 'date-fns';

type UseWeeklyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

function endOfDayUTC(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export const useWeeklyChatActivity = ({ displacement, utc }: UseWeeklyChatActivityOptions) => {
	const getWeeklyChatActivity = useEndpoint('GET', '/v1/engagement-dashboard/users/chat-busier/weekly-data');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/weekly-chat-activity', { displacement, utc }],

		queryFn: async () => {
			const end = utc ? endOfDayUTC(new Date()) : endOfDay(new Date());
			const day = subWeeks(end, displacement);

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
