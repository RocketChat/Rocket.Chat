import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventImportProps = {
	startTime: string;
	externalId: string;
	subject: string;
	description: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
};

const calendarEventImportPropsSchema: JSONSchemaType<CalendarEventImportProps> = {
	type: 'object',
	properties: {
		startTime: {
			type: 'string',
			nullable: false,
		},
		externalId: {
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
	required: ['startTime', 'externalId', 'subject', 'description'],
	additionalProperties: false,
};

export const isCalendarEventImportProps = ajv.compile(calendarEventImportPropsSchema);
