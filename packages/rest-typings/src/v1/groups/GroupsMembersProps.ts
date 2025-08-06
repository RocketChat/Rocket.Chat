import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from './../Ajv';


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
