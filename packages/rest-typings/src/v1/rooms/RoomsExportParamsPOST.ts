import { ajv } from '../../Ajv';

export type POSTRoomsExport = {
	rid: string;
	type: 'file' | 'email';

	toUsers?: string[];
	toEmails?: string[];
	additionalEmails?: string;
	subject?: string;
	messages?: string[];
	dateFrom?: string;
	dateTo?: string;
	format?: 'html' | 'json';
};

const POSTRoomsExportSchema = {
	type: 'object',
	properties: {
		rid: {
			type: 'string',
		},
		type: {
			type: 'string',
			enum: ['file', 'email'],
		},
		toUsers: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		toEmails: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		additionalEmails: {
			type: 'string',
			nullable: true,
		},
		subject: {
			type: 'string',
			nullable: true,
		},
		messages: {
			type: 'array',
			items: {
				type: 'string',
			},
			minItems: 1,
			nullable: true,
		},
		dateFrom: {
			type: 'string',
			nullable: true,
		},
		dateTo: {
			type: 'string',
			nullable: true,
		},
		format: {
			type: 'string',
			enum: ['html', 'json'],
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['rid', 'type'],
};

export const isPOSTRoomsExport = ajv.compile<POSTRoomsExport>(POSTRoomsExportSchema);
