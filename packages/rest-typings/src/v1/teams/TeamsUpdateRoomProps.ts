import type { IRoom } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type TeamsUpdateRoomProps = { roomId: IRoom['_id']; isDefault: boolean };

const teamsUpdateRoomPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		isDefault: { type: 'boolean' },
	},
	required: ['roomId', 'isDefault'],
	additionalProperties: false,
};

export const isTeamsUpdateRoomProps = ajv.compile<TeamsUpdateRoomProps>(teamsUpdateRoomPropsSchema);
