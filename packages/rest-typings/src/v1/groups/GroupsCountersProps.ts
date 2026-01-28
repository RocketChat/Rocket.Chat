import { ajv } from '../Ajv';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsCountersProps = GroupsBaseProps & { userId?: string };

const GroupsCountersPropsSchema = withGroupBaseProperties({
	userId: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);
