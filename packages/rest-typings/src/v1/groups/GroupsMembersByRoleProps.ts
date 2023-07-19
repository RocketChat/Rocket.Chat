import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsMembersByRoleProps = PaginatedRequest<GroupsBaseProps & { role?: string; filter?: string; status?: string[] }>;

const GroupsMembersByRolePropsSchema = withGroupBaseProperties({
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
	role: {
		type: 'string',
		nullable: true,
	},
	status: {
		type: 'array',
		items: { type: 'string' },
		nullable: true,
	},
});

export const isGroupsMembersByRoleProps = ajv.compile<GroupsMembersByRoleProps>(GroupsMembersByRolePropsSchema);
