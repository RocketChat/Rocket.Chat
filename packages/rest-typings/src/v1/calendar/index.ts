import type { ICalendarEvent } from '@rocket.chat/core-typings';

import type { CalendarEventCreateProps } from './CalendarEventCreateProps.js';
import type { CalendarEventDeleteProps } from './CalendarEventDeleteProps.js';
import type { CalendarEventImportProps } from './CalendarEventImportProps.js';
import type { CalendarEventInfoProps } from './CalendarEventInfoProps.js';
import type { CalendarEventListProps } from './CalendarEventListProps.js';
import type { CalendarEventUpdateProps } from './CalendarEventUpdateProps.js';

export * from './CalendarEventCreateProps.js';
export * from './CalendarEventDeleteProps.js';
export * from './CalendarEventImportProps.js';
export * from './CalendarEventInfoProps.js';
export * from './CalendarEventUpdateProps.js';
export * from './CalendarEventListProps.js';

export type CalendarEndpoints = {
	'/v1/calendar-events.create': {
		POST: (params: CalendarEventCreateProps) => { id: ICalendarEvent['_id'] };
	};

	'/v1/calendar-events.list': {
		GET: (params: CalendarEventListProps) => { data: ICalendarEvent[] };
	};

	'/v1/calendar-events.info': {
		GET: (params: CalendarEventInfoProps) => { event: ICalendarEvent };
	};

	'/v1/calendar-events.import': {
		POST: (params: CalendarEventImportProps) => { id: ICalendarEvent['_id'] };
	};

	'/v1/calendar-events.update': {
		POST: (params: CalendarEventUpdateProps) => void;
	};

	'/v1/calendar-events.delete': {
		POST: (params: CalendarEventDeleteProps) => void;
	};
};
