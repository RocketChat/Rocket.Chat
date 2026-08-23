import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type ScheduledMessageUpdateProps = {
	id: string;
	msg?: string;
	/** ISO 8601 date string of when the message should be sent. */
	scheduledAt?: string;
};

const scheduledMessageUpdatePropsSchema: JSONSchemaType<ScheduledMessageUpdateProps> = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			minLength: 1,
		},
		msg: {
			type: 'string',
			minLength: 1,
			nullable: true,
		},
		scheduledAt: {
			type: 'string',
			format: 'date-time',
			nullable: true,
		},
	},
	required: ['id'],
	additionalProperties: false,
};

export const isScheduledMessageUpdateProps = ajv.compile(scheduledMessageUpdatePropsSchema);
