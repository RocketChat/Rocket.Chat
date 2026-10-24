import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

/**
 * Generic hook to fetch calendar events for a given date.
 *
 * This hook calls the provider-agnostic `/v1/calendar-events.list` endpoint,
 * so it works regardless of the calendar source (Outlook, Google, CalDAV, etc.).
 *
 * @param date - The date for which to fetch calendar events.
 * @returns A React Query result containing the list of calendar events.
 */
export const useCalendarList = (date: Date) => {
	const calendarData = useEndpoint('GET', '/v1/calendar-events.list');

	return useQuery({
		queryKey: ['calendar', 'list', date.toISOString()],

		queryFn: async () => {
			const { data } = await calendarData({ date: date.toISOString() });
			return data;
		},
	});
};

/**
 * Convenience wrapper that fetches calendar events for today's date.
 */
export const useCalendarListForToday = () => {
	return useCalendarList(new Date());
};
