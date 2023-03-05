import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsConvertToTeamProps =
	| { roomId: IRoom['_id']; roomName?: IRoom['name'] }
	| { roomName: IRoom['name']; roomId?: IRoom['_id'] };

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
