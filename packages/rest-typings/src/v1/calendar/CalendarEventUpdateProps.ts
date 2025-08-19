import type { ICalendarEvent } from '@rocket.chat/core-typings';
import type { JSONSchemaType } from 'ajv';
import Ajv from 'ajv';

const ajv = new Ajv();

export type CalendarEventUpdateProps = {
	eventId: ICalendarEvent['_id'];
	startTime: string;
	endTime?: string;
	subject: string;
	description: string;
	meetingUrl?: string;
	reminderMinutesBeforeStart?: number;
	busy?: boolean;
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
		endTime: {
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
		busy: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['eventId', 'startTime', 'subject', 'description'],
	additionalProperties: false,
};

export const isCalendarEventUpdateProps = ajv.compile(calendarEventUpdatePropsSchema);
