import type { ICalendarEvent } from '@rocket.chat/core-typings';
import type { CalendarEventCreateProps } from './CalendarEventCreateProps';
import type { CalendarEventListProps } from './CalendarEventListProps';
import type { CalendarEventUpdateProps } from './CalendarEventUpdateProps';
// import type { PaginatedResult } from '../../helpers/PaginatedResult';

export * from './CalendarEventCreateProps';
export * from './CalendarEventListProps';

export type CalendarEndpoints = {
	'/v1/calendar-events.create': {
		POST: (params: CalendarEventCreateProps) => void;
	};

	'/v1/calendar-events.list': {
		GET: (params: CalendarEventListProps ) => { events: ICalendarEvent[] };
	};

	'/v1/calendar-events.update': {
		POST: (params: CalendarEventUpdateProps) => void;
	}
};



