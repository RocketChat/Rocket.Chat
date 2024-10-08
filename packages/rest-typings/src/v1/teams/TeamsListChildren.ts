import type { ITeam } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

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
		offset: { type: 'number' },
		count: { type: 'number' },
		sort: { type: 'string' },
	},
	additionalProperties: false,
	oneOf: [{ required: ['teamId'] }, { required: ['teamName'] }, { required: ['roomId'] }],
};

export const isTeamsListChildrenProps = ajv.compile<TeamsListChildrenProps>(TeamsListChildrenPropsSchema);
