import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsConvertToTeamProps =
	| { roomId: IRoom['_id']; roomName?: never }
	| { roomName: Exclude<IRoom['name'], undefined>; roomId?: never };

const GroupsConvertToTeamPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		roomName: {
			type: 'string',
		},
	},
	required: ['roomId', 'roomName'],
	additionalProperties: false,
};

export const isGroupsConvertToTeamProps = ajv.compile<GroupsConvertToTeamProps>(GroupsConvertToTeamPropsSchema);
