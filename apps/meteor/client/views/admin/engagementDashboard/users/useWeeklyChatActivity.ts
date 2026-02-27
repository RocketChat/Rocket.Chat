import { endOfDay, subWeeks } from 'date-fns';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type UseWeeklyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

function endOfDayUTC(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
