import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type RoomsExportProps = {
	rid: IRoom['_id'];
	type: 'email' | 'file';
	toUsers?: IUser['username'][];
	toEmails?: string[];
	additionalEmails?: string;
	subject?: string;
	messages?: IMessage['_id'][];
	dateFrom?: string;
	dateTo?: string;
	format?: 'html' | 'json';
};

const RoomsExportSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				rid: {
					type: 'string',
				},
				type: {
					type: 'string',
					enum: ['email'],
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
				subject: {
					type: 'string',
				},
				messages: {
					type: 'array',
					items: {
						type: 'string',
					},
				},
			},
			required: ['rid', 'type', 'subject', 'messages'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				rid: {
					type: 'string',
				},
				type: {
					type: 'string',
					enum: ['file'],
				},
				dateFrom: {
					type: 'string',
				},
				dateTo: {
					type: 'string',
				},
				format: {
					type: 'string',
					enum: ['html', 'json'],
				},
			},
			required: ['rid', 'type', 'format'],
			additionalProperties: false,
		},
	],
};

export const isRoomsExportProps = ajv.compile<RoomsExportProps>(RoomsExportSchema);
