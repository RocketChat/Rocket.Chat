import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsCountersProps = GroupsBaseProps & { userId?: string };

const GroupsCountersPropsSchema = withGroupBaseProperties({
	userId: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);
