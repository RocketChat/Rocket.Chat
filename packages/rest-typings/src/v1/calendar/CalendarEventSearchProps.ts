import type { JSONSchemaType } from 'ajv';
import { ajv } from '../../Ajv';

export type CalendarEventSearchProps = {
	text: string;
};

const calendarEventSearchPropsSchema: JSONSchemaType<CalendarEventSearchProps> = {
	type: 'object',
	properties: {
		text: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['text'],
	additionalProperties: false,
};

export const isCalendarEventSearchProps = ajv.compile(calendarEventSearchPropsSchema);