import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type CalendarEventListProps = { date: string };

const calendarEventListPropsSchema: JSONSchemaType<CalendarEventListProps> = {
	type: 'object',
	properties: {
		date: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['date'],
	additionalProperties: false,
};

export const isCalendarEventListProps = ajv.compile(calendarEventListPropsSchema);
