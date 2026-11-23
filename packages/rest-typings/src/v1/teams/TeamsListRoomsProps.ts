import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

export type TeamsListRoomsProps = PaginatedRequest<
	({ teamId: string } | { teamName: string }) & {
		filter?: string;
		type?: string;
	}
>;

const teamsListRoomsPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		filter: { type: 'string', nullable: true },
		type: { type: 'string', nullable: true },
		...paginationQueryProperties,
		sort: { type: 'string', nullable: true },
	},
	oneOf: [
		{ type: 'object', required: ['teamId'] },
		{ type: 'object', required: ['teamName'] },
	],
	additionalProperties: false,
};

export const isTeamsListRoomsProps = ajvQuery.compile<TeamsListRoomsProps>(teamsListRoomsPropsSchema);
