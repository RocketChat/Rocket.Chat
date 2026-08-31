import type { JSONSchemaType } from 'ajv';

import { ajvQuery } from '../Ajv';

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

export const isCalendarEventInfoProps = ajvQuery.compile(calendarEventInfoPropsSchema);
