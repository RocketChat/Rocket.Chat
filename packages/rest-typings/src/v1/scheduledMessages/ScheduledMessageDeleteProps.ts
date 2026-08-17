import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type ScheduledMessageDeleteProps = {
	id: string;
};

const scheduledMessageDeletePropsSchema: JSONSchemaType<ScheduledMessageDeleteProps> = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['id'],
	additionalProperties: false,
};

export const isScheduledMessageDeleteProps = ajv.compile(scheduledMessageDeletePropsSchema);
