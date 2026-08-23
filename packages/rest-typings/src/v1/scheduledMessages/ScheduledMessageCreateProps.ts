import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type ScheduledMessageCreateProps = {
	rid: string;
	msg: string;
	/** ISO 8601 date string of when the message should be sent. */
	scheduledAt: string;
	tmid?: string;
	tshow?: boolean;
};

const scheduledMessageCreatePropsSchema: JSONSchemaType<ScheduledMessageCreateProps> = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
			minLength: 1,
		},
		msg: {
			type: 'string',
			minLength: 1,
		},
		scheduledAt: {
			type: 'string',
			format: 'date-time',
		},
		tmid: {
			type: 'string',
			nullable: true,
		},
		tshow: {
			type: 'boolean',
			nullable: true,
		},
	},
	required: ['rid', 'msg', 'scheduledAt'],
	additionalProperties: false,
};

export const isScheduledMessageCreateProps = ajv.compile(scheduledMessageCreatePropsSchema);
