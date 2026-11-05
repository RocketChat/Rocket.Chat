import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';

export type GroupsHistoryProps = PaginatedRequest<
	GroupsBaseProps & {
		latest?: string;
		oldest?: string;
		inclusive?: 'true' | 'false';
		unreads?: 'true' | 'false';
		showThreadMessages?: string;
	}
>;
const groupsHistoryPropsSchema = withGroupBaseProperties({
	latest: {
		type: 'string',
		nullable: true,
	},
	oldest: {
		type: 'string',
		nullable: true,
	},
	inclusive: {
		type: 'string',
		nullable: true,
	},
	unreads: {
		type: 'string',
		nullable: true,
	},
	showThreadMessages: {
		type: 'string',
		nullable: true,
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
});
export const isGroupsHistoryProps = ajv.compile<GroupsHistoryProps>(groupsHistoryPropsSchema);
