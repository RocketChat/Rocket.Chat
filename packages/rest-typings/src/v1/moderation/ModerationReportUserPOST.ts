import type { IUser } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type ModerationReportUserPOST = {
	userId: IUser['_id'];
	description: string;
};

const reportUserPropsSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		description: {
			type: 'string',
			minLength: 1,
		},
	},
	required: ['userId', 'description'],
	additionalProperties: false,
};

export const isModerationReportUserPost = ajv.compile<ModerationReportUserPOST>(reportUserPropsSchema);
