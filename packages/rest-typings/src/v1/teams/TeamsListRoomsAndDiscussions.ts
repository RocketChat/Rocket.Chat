import type { ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

export type TeamsListRoomsAndDiscussionsProps = PaginatedRequest<{
	teamId: ITeam['_id'];
	filter?: string;
}>;

const TeamsListRoomsAndDiscussionsPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		filter: { type: 'string' },
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
	},
	required: ['teamId'],
	additionalProperties: false,
};

export const isTeamsListRoomsAndDiscussionsProps = ajv.compile<TeamsListRoomsAndDiscussionsProps>(TeamsListRoomsAndDiscussionsPropsSchema);
