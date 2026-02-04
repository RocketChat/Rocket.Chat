import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

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
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
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
	oneOf: [{ required: ['roomId'] }, { required: ['roomName'] }],
	required: [],
	additionalProperties: true, // keep additional properties for backwards compatibility, otherwise this would be a breaking change
};

export const isGroupsFilesProps = ajv.compile<GroupsFilesProps>(GroupsFilesPropsSchema);
