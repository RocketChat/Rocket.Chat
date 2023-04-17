/* eslint-disable new-cap */
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getOutlookEvents } from '../lib/outlookCalendar/getOutlookEvents';

export const useSyncOutlookEvents = (date: Date, server: string, user: string, password: string): (() => Promise<void>) => {
	const getCalendarEventsList = useEndpoint('GET', '/v1/calendar-events.list');
	const createCalendarEvent = useEndpoint('POST', '/v1/calendar-events.create');
	const updateCalendarEvent = useEndpoint('POST', '/v1/calendar-events.update');
	const deleteCalendarEvent = useEndpoint('POST', '/v1/calendar-events.delete');

	// Load all the events that are already on the calendar for today
	const { data: serverEvents } = useQuery(['calendar-events'], async () =>
		getCalendarEventsList({ date: date.toISOString().substring(0, 10) }),
	);

	const syncEvents = async () => {
		const externalEvents = serverEvents?.data.filter(({ externalId }) => externalId);

		const appointments = await getOutlookEvents(date, server, user, password);
		const appointmentsFound = appointments.map((appointment) => appointment.Id.UniqueId);

		for await (const appointment of appointments) {
			try {
				const existingEvent = externalEvents?.find(({ externalId }) => externalId === appointment.Id.UniqueId);

				const externalId = appointment.Id.UniqueId;
				const subject = appointment.Subject;
				const startTime = appointment.Start.ToISOString();
				const description = appointment.Body?.Text || '';

				// If the appointment is not in the rocket.chat calendar, add it.
				if (!existingEvent) {
					await createCalendarEvent({
						externalId,
						subject,
						startTime,
						description,
					});
					continue;
				}

				// If nothing on the event has changed, do nothing.
				if (existingEvent.subject === subject && existingEvent.startTime === startTime && existingEvent.description === description) {
					continue;
				}

				// Update the server with the current data from outlook
				await updateCalendarEvent({
					eventId: existingEvent._id,
					startTime,
					subject,
					description,
				});
			} catch (e) {
				console.error(e);
			}
		}

		if (!externalEvents) {
			return;
		}

		for await (const event of externalEvents) {
			if (!event.externalId || appointmentsFound.includes(event.externalId)) {
				continue;
			}

			try {
				await deleteCalendarEvent({ eventId: event._id });
			} catch (e) {
				console.error(e);
			}
		}
	};

	return syncEvents;
};
