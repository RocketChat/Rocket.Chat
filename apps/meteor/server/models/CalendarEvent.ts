import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { CalendarEventRaw } from './raw/CalendarEvent';

registerModel('ICalendarEventModel', new CalendarEventRaw(db));
