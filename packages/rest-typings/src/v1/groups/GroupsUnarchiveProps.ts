import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

export type GroupsUnarchiveProps = {
	roomId: IRoom['_id'];
};

const GroupsUnarchivePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsUnarchiveProps = ajv.compile<GroupsUnarchiveProps>(GroupsUnarchivePropsSchema);
