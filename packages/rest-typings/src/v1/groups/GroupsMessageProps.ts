import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

export type GroupsMessageProps = PaginatedRequest<GroupsBaseProps>;

const GroupsMessagePropsSchema = withGroupBaseProperties({
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

export const isGroupsMessageProps = ajv.compile<GroupsMessageProps>(GroupsMessagePropsSchema);
