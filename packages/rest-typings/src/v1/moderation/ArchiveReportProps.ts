import type { IReport, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

// Define the type of the request body of call to hide the reported message

export type ArchiveReportProps = {
	userId: IUser['_id'];
	actionTaken?: string;
	msgId?: IReport['message']['_id'];
	reasonForHiding?: string;
};

const ArchiveReportPropsSchema = {
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

export const isArchiveReportProps = ajv.compile<ArchiveReportProps>(ArchiveReportPropsSchema);
