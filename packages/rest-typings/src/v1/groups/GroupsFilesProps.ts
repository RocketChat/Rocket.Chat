import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';
import type { GroupsBaseProps } from './BaseProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

export type GroupsFilesProps = PaginatedRequest<GroupsBaseProps> & {
	name?: string;
	typeGroup?: string;
	onlyConfirmed?: boolean;
};

const GroupsFilesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: true,
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		typeGroup: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
		onlyConfirmed: {
			type: 'boolean',
		},
	},
	oneOf: [
		{ type: 'object', required: ['roomId'] },
		{ type: 'object', required: ['roomName'] },
	],
	required: [],
	additionalProperties: true, // keep additional properties for backwards compatibility, otherwise this would be a breaking change
};

export const isGroupsFilesProps = ajvQuery.compile<GroupsFilesProps>(GroupsFilesPropsSchema);
