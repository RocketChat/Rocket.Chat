import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

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
