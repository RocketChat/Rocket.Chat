import { ajv } from '../../helpers/schemas';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

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
