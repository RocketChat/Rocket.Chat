import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

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
		...paginationQueryProperties,
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
