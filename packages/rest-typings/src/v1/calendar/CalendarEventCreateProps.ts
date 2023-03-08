import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventCreateProps = {
	startTime: string;
	externalId?: string;
	subject: string;
};

const calendarEventCreatePropsSchema: JSONSchemaType<CalendarEventCreateProps> = {
	type: 'object',
	properties: {
		startTime: {
			type: 'string',
			nullable: false,
		},
		externalId: {
			type: 'string',
			nullable: true,
		},
		subject: {
			type: 'string',
			nullable: false,
		},
	},
	required: ['startTime', 'subject'],
	additionalProperties: false,
};

export const isCalendarEventCreateProps = ajv.compile(calendarEventCreatePropsSchema);
