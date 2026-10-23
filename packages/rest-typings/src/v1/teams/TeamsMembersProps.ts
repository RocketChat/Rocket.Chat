import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type TeamsMembersProps = PaginatedRequest<
	({ teamId: string } | { teamName: string }) & {
		status?: string[];
		username?: string;
		name?: string;
	}
>;

const teamsMembersPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		status: { type: 'array', items: { type: 'string' }, nullable: true },
		username: { type: 'string', nullable: true },
		name: { type: 'string', nullable: true },
		...paginationQueryProperties,
		sort: { type: 'string', nullable: true },
	},
	oneOf: [
		{ type: 'object', required: ['teamId'] },
		{ type: 'object', required: ['teamName'] },
	],
	additionalProperties: false,
};

export const isTeamsMembersProps = ajvQuery.compile<TeamsMembersProps>(teamsMembersPropsSchema);
