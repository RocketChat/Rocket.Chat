import type { ICalendarEvent } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventDeleteProps = {
	eventId: ICalendarEvent['_id'];
};

const calendarEventDeletePropsSchema: JSONSchemaType<CalendarEventDeleteProps> = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
		},
	},
	required: ['eventId'],
	additionalProperties: false,
};

export const isCalendarEventDeleteProps = ajv.compile(calendarEventDeletePropsSchema);
