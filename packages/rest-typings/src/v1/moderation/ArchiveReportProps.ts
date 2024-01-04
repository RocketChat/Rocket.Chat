import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type ArchiveReportPropsPOST = {
	userId?: IUser['_id'];
	msgId?: IMessage['_id'];
	action?: string;
	reason?: string;
};

const archiveReportPropsSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
		msgId: {
			type: 'string',
		},
		reason: {
			type: 'string',
			nullable: true,
		},
		action: {
			type: 'string',
			nullable: true,
		},
	},
	oneOf: [{ required: ['msgId'] }, { required: ['userId'] }],
	additionalProperties: false,
};

export const isArchiveReportProps = ajv.compile<ArchiveReportPropsPOST>(archiveReportPropsSchema);
