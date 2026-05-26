import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type TeamsListRoomsOfUserProps = PaginatedRequest<
	({ teamId: string } | { teamName: string }) & {
		userId: string;
		canUserDelete?: string;
	}
>;

const teamsListRoomsOfUserPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		userId: { type: 'string' },
		canUserDelete: { type: 'string', nullable: true },
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
	},
	oneOf: [
		{ type: 'object', required: ['teamId'] },
		{ type: 'object', required: ['teamName'] },
	],
	required: ['userId'],
	additionalProperties: false,
};

export const isTeamsListRoomsOfUserProps = ajvQuery.compile<TeamsListRoomsOfUserProps>(teamsListRoomsOfUserPropsSchema);
