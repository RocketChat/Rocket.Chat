import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

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
		offset: { type: 'number', nullable: true },
		count: { type: 'number', nullable: true },
		sort: { type: 'string', nullable: true },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: false,
};

export const isTeamsListRoomsProps = ajvQuery.compile<TeamsListRoomsProps>(teamsListRoomsPropsSchema);
