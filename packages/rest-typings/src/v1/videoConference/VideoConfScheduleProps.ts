import type { JSONSchemaType } from 'ajv';

import { ajv } from '../Ajv';

export type VideoConfScheduleProps = {
	/** Of the person booking, who becomes the host of every conference started from the booking. */
	email: string;
	invitees: string[];
	/** Whether to reserve a number SIP endpoints can dial. */
	sipAlias: boolean;
	title?: string;
};

const videoConfSchedulePropsSchema: JSONSchemaType<VideoConfScheduleProps> = {
	type: 'object',
	properties: {
		email: {
			type: 'string',
			minLength: 1,
		},
		invitees: {
			type: 'array',
			items: {
				type: 'string',
				minLength: 1,
			},
		},
		sipAlias: {
			type: 'boolean',
		},
		title: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['email', 'invitees', 'sipAlias'],
	additionalProperties: false,
};

export const isVideoConfScheduleProps = ajv.compile(videoConfSchedulePropsSchema);
