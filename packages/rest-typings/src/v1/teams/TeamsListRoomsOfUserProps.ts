import type { ITeam, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv();

export type TeamsListRoomsOfUserProps = PaginatedRequest<
	| {
			teamId: ITeam['_id'];
			userId: IUser['_id'];
			canUserDelete?: string;
	  }
	| {
			teamName: ITeam['name'];
			userId: IUser['_id'];
			canUserDelete?: string;
	  }
>;

const teamsListRoomsOfUserPropsSchema = {
	type: 'object',
	properties: {
		teamId: { type: 'string' },
		teamName: { type: 'string' },
		userId: { type: 'string' },
		count: { type: 'number' },
		offset: { type: 'number' },
		query: { type: 'string' },
		sort: { type: 'string' },
		canUserDelete: { type: 'string' },
	},
	oneOf: [{ required: ['teamId', 'userId'] }, { required: ['teamName', 'userId'] }],
	additionalProperties: false,
};

export const isTeamsListRoomsOfUserProps = ajv.compile<TeamsListRoomsOfUserProps>(teamsListRoomsOfUserPropsSchema);
