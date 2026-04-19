import { ajv } from '../Ajv';

export type TeamsUpdateRoomProps = {
	roomId: string;
	isDefault: boolean;
};

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