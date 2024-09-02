import type { ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

export type TeamsListChildrenProps =
	| PaginatedRequest<{
			teamId: ITeam['_id'];
			filter?: string;
	  }>
	| PaginatedRequest<{ teamName: ITeam['name']; filter?: string }>;

const TeamsListChildrenPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		filter: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
	},
	additionalProperties: false,
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }],
};

export const isTeamsListChildrenProps = ajv.compile<TeamsListChildrenProps>(TeamsListChildrenPropsSchema);
