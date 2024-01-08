import Ajv from 'ajv';
import type { JSONSchemaType } from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type CalendarEventInfoProps = { id: string };

const calendarEventInfoPropsSchema: JSONSchemaType<CalendarEventInfoProps> = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['id'],
	additionalProperties: false,
};

export const isCalendarEventInfoProps = ajv.compile(calendarEventInfoPropsSchema);
