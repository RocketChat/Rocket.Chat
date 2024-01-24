import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

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
		filter: { type: 'string' },
		type: { type: 'string' },
		count: { type: 'number' },
		offset: { type: 'number' },
		query: { type: 'string' },
		sort: { type: 'string' },
	},
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
	additionalProperties: false,
};

export const isTeamsListRoomsProps = ajv.compile<TeamsListRoomsProps>(teamsListRoomsPropsSchema);
