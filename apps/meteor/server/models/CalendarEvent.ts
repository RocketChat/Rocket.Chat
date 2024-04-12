import { registerModel } from '@rocket.chat/models';

import { CalendarEventRaw } from './raw/CalendarEvent';

registerModel('ICalendarEventModel', new CalendarEventRaw());
