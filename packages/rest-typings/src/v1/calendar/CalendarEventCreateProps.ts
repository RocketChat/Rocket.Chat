import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventCreateProps = { startTime: string };

const calendarEventCreatePropsSchema: JSONSchemaType<CalendarEventCreateProps> = {
	type: 'object',
	properties: {
		startTime: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['startTime'],
	additionalProperties: false,
};

export const isCalendarEventCreateProps = ajv.compile(calendarEventCreatePropsSchema);
