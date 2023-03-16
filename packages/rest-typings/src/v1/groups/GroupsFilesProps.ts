import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsFilesProps = {
	roomId: IRoom['_id'];
	count: number;
	sort: string;
	query: string;
};

const GroupsFilesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		count: {
			type: 'number',
		},
		sort: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
	},
	required: ['roomId', 'count', 'sort', 'query'],
	additionalProperties: false,
};

export const isGroupsFilesProps = ajv.compile<GroupsFilesProps>(GroupsFilesPropsSchema);
