import type { IRoom } from '@rocket.chat/core-typings';

import { ajvQuery } from '../Ajv.js';
import { withGroupBaseProperties } from './BaseProps.js';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';

export type GroupsMessagesProps = PaginatedRequest<
	({ roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) & {
		mentionIds?: string;
		starredIds?: string;
		pinned?: boolean;
	}
>;

const GroupsMessagesPropsSchema = withGroupBaseProperties({
	roomId: {
		type: 'string',
	},
	roomName: {
		type: 'string',
	},
	mentionIds: {
		type: 'string',
	},
	starredIds: {
		type: 'string',
	},
	pinned: {
		type: 'string',
	},
	count: {
		type: 'number',
		nullable: true,
	},
	offset: {
		type: 'number',
		nullable: true,
	},
	sort: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsMessagesProps = ajvQuery.compile<GroupsMessagesProps>(GroupsMessagesPropsSchema);
