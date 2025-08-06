import type { IRoom } from '@rocket.chat/core-typings';

import { withGroupBaseProperties } from './BaseProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from '../Ajv';

export type GroupsMessagesProps = PaginatedRequest<
	({ roomId: IRoom['_id'] } | { roomName: IRoom['name'] }) & {
		mentionIds?: string;
		starredIds?: string;
		pinned?: boolean;
		query?: Record<string, any>;
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
	query: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsMessagesProps = ajv.compile<GroupsMessagesProps>(GroupsMessagesPropsSchema);
