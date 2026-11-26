import type { ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajvQuery } from '../Ajv.js';
import { paginationQueryProperties } from '../pagination.js';

type GeneralProps = {
	filter?: string;
	type?: 'channels' | 'discussions';
};

export type TeamsListChildrenProps =
	| PaginatedRequest<
			{
				teamId: ITeam['_id'];
			} & GeneralProps
	  >
	| PaginatedRequest<{ teamName: ITeam['name'] } & GeneralProps>
	| PaginatedRequest<{ roomId: ITeam['roomId'] } & GeneralProps>;

const TeamsListChildrenPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		type: { type: 'string', enum: ['channels', 'discussions'] },
		roomId: { type: 'string' },
		filter: { type: 'string' },
		...paginationQueryProperties,
		sort: { type: 'string' },
	},
	additionalProperties: false,
	oneOf: [
		{ type: 'object', required: ['teamId'] },
		{ type: 'object', required: ['teamName'] },
		{ type: 'object', required: ['roomId'] },
	],
};

export const isTeamsListChildrenProps = ajvQuery.compile<TeamsListChildrenProps>(TeamsListChildrenPropsSchema);
