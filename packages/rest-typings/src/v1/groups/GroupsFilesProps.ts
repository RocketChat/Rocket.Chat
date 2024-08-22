import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsFilesProps = PaginatedRequest<GroupsBaseProps>;

const GroupsFilesPropsSchema = withGroupBaseProperties({
	count: {
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
	offset: {
		type: 'number',
		nullable: true,
	},
});

export const isGroupsFilesProps = ajv.compile<GroupsFilesProps>(GroupsFilesPropsSchema);
