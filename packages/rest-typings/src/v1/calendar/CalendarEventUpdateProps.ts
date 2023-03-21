import type { ICalendarEvent } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventUpdateProps = {
	eventId: ICalendarEvent['_id'];
	startTime: string;
	subject: string;
	description: string;
};

const calendarEventUpdatePropsSchema: JSONSchemaType<CalendarEventUpdateProps> = {
	type: 'object',
	properties: {
		eventId: {
			type: 'string',
			nullable: false,
		},
		startTime: {
			type: 'string',
			nullable: false,
		},
		subject: {
			type: 'string',
			nullable: false,
		},
		description: {
			type: 'string',
			nullable: false,
		}
	},
	required: ['eventId', 'startTime', 'subject', 'description'],
	additionalProperties: false,
};

export const isCalendarEventUpdateProps = ajv.compile(calendarEventUpdatePropsSchema);
