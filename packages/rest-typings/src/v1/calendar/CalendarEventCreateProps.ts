import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventCreateProps = {
	startTime: string;
	externalId?: string;
	subject: string;
	description: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
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
		description: {
			type: 'string',
			nullable: false,
		},
		meetingUrl: {
			type: 'string',
			nullable: true,
		},
		reminderMinutesBeforeStart: {
			type: 'number',
			nullable: true,
		},
	},
	required: ['startTime', 'subject', 'description'],
	additionalProperties: false,
};

export const isCalendarEventCreateProps = ajv.compile(calendarEventCreatePropsSchema);
