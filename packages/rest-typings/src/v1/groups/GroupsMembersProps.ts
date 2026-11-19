import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';

export type GroupsMembersProps = PaginatedRequest<GroupsBaseProps & { filter?: string; status?: string[] }>;

const GroupsMembersPropsSchema = withGroupBaseProperties({
	offset: {
		type: 'number',
		nullable: true,
	},
	count: {
		type: 'number',
		nullable: true,
	},
	filter: {
		type: 'string',
		nullable: true,
	},
	status: {
		type: 'array',
		items: { type: 'string' },
		nullable: true,
	},
});

export const isGroupsMembersProps = ajv.compile<GroupsMembersProps>(GroupsMembersPropsSchema);
