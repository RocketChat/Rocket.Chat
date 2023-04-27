/* eslint-disable new-cap */
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

type AppointmentData = {
	id: string;
	subject: string;
	startTime: Date;
	endTime: Date;
	description: string;

	isAllDay: boolean;
	isCanceled: boolean;
	organizer?: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
	reminderDueBy?: Date;
};


export const useSyncOutlookEvents = (): (() => Promise<void>) => {
	const date = new Date();
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

		const appointments = await window.RocketChatDesktop.getOutlookEvents(date) as AppointmentData[];
		const appointmentsFound = appointments.map((appointment) => appointment.id);

		for await (const appointment of appointments) {
			try {
				const existingEvent = externalEvents?.find(({ externalId }) => externalId === appointment.id);

				const { id: externalId, subject, startTime: startTimeObj, description } = appointment;
				const startTime = startTimeObj.toISOString();

				// If the appointment is not in the rocket.chat calendar for today, add it.
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
