import type { IModerationReport, IUser } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type ArchiveReportPropsPOST = {
	userId?: IUser['_id'];
	msgId?: IModerationReport['message']['_id'];
	actionTaken?: string;
	reasonForHiding?: string;
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
		reasonForHiding: {
			type: 'string',
			nullable: true,
		},
		actionTaken: {
			type: 'string',
			nullable: true,
		},
	},
	oneOf: [{ required: ['msgId'] }, { required: ['userId'] }],
	additionalProperties: false,
};

export const isArchiveReportProps = ajv.compile<ArchiveReportPropsPOST>(archiveReportPropsSchema);
