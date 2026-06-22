import { ajv } from '../Ajv';

export type TeamsUpdateRoomProps = {
	roomId: string;
	isDefault: boolean;
	// TODO: teamId is accepted but never used by the endpoint handler — callers should stop sending it
	teamId?: string;
};

const teamsUpdateRoomPropsSchema = {
	type: 'object',
	properties: {
		roomId: { type: 'string' },
		isDefault: { type: 'boolean' },
		// TODO: teamId is accepted but never used by the endpoint handler — callers should stop sending it
		teamId: { type: 'string' },
	},
	required: ['roomId', 'isDefault'],
	additionalProperties: false,
};

export const isTeamsUpdateRoomProps = ajv.compile<TeamsUpdateRoomProps>(teamsUpdateRoomPropsSchema);
