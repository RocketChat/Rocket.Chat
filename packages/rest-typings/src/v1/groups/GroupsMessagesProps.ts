import type { IRoom } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import { withGroupBaseProperties } from './BaseProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

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
