import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { endOfDay, subDays } from 'date-fns';

type UseHourlyChatActivityOptions = {
	displacement: number;
	utc: boolean;
};

function endOfDayUTC(d: Date): Date {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export const useHourlyChatActivity = ({ displacement, utc }: UseHourlyChatActivityOptions) => {
	const getHourlyChatActivity = useEndpoint('GET', '/v1/engagement-dashboard/users/chat-busier/hourly-data');

	return useQuery({
		queryKey: ['admin/engagement-dashboard/users/hourly-chat-activity', { displacement, utc }],

		queryFn: async () => {
			const end = utc ? endOfDayUTC(new Date()) : endOfDay(new Date());
			const day = subDays(end, displacement);

			const response = await getHourlyChatActivity({
				start: day.toISOString(),
			});

			if (!utc && response) {
				const dayStart = new Date(day);
				dayStart.setHours(0, 0, 0, 0);
				response.hours = response.hours.map((hours) => {
					const utcDate = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), dayStart.getUTCDate(), hours.hour, 0, 0, 0));
					return {
						hour: utcDate.getHours(),
						users: hours.users,
					};
				});
			}

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
