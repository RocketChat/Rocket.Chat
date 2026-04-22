import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

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
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: false,
};

export const isTeamsMembersProps = ajvQuery.compile<TeamsMembersProps>(teamsMembersPropsSchema);
