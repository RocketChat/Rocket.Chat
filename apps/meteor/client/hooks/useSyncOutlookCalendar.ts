/* eslint-disable new-cap */
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { getDesktopApp } from '../lib/utils/getDesktopApp';

export const useSyncOutlookEvents = (): (() => Promise<void>) => {
	const date = new Date();
	const desktopApp = getDesktopApp();
	const getCalendarEventsList = useEndpoint('GET', '/v1/calendar-events.list');
	const importCalendarEvent = useEndpoint('POST', '/v1/calendar-events.import');
	const updateCalendarEvent = useEndpoint('POST', '/v1/calendar-events.update');
	const deleteCalendarEvent = useEndpoint('POST', '/v1/calendar-events.delete');

	// Load all the events that are already on the calendar for today
	const { data: serverEvents } = useQuery(['calendar-events'], async () =>
		getCalendarEventsList({ date: date.toISOString().substring(0, 10) }),
	);

	const syncEvents = async () => {
		if (!desktopApp) {
			return;
		}

		const appointments = await desktopApp.getOutlookEvents(date);
		const appointmentsFound = appointments.map((appointment) => appointment.id);

		const externalEvents = serverEvents?.data.filter(({ externalId }) => externalId);

		for await (const appointment of appointments) {
			try {
				const existingEvent = externalEvents?.find(({ externalId }) => externalId === appointment.id);

				const {
					id: externalId,
					subject,
					startTime: startTimeObj,
					description,
					reminderMinutesBeforeStart,
					reminderDueBy: reminderDueByObj,
				} = appointment;
				const startTime = startTimeObj.toISOString();
				const reminderDueBy = reminderDueByObj ? reminderDueByObj.toISOString() : undefined;

				// If the appointment is not in the rocket.chat calendar for today, add it.
				if (!existingEvent) {
					await importCalendarEvent({
						externalId,
						subject,
						startTime,
						description,
						reminderMinutesBeforeStart,
						reminderDueBy,
					});
					continue;
				}

				// If nothing on the event has changed, do nothing.
				if (
					existingEvent.subject === subject &&
					existingEvent.startTime === startTime &&
					existingEvent.description === description &&
					existingEvent.reminderDueBy === reminderDueBy &&
					existingEvent.reminderMinutesBeforeStart === reminderMinutesBeforeStart
				) {
					continue;
				}

				// Update the server with the current data from outlook
				await updateCalendarEvent({
					eventId: existingEvent._id,
					startTime,
					subject,
					description,
					reminderMinutesBeforeStart,
					reminderDueBy,
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
