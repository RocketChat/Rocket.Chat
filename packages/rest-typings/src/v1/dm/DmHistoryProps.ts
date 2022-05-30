import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export type DmHistoryProps = {
	roomId: string;
	latest?: string;
};

const DmHistoryPropsSchema: JSONSchemaType<DmHistoryProps> = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		latest: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmHistoryProps = ajv.compile(DmHistoryPropsSchema);
