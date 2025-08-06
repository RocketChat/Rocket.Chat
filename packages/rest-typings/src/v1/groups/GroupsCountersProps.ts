import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


export type GroupsCountersProps = GroupsBaseProps & { userId?: string };

const GroupsCountersPropsSchema = withGroupBaseProperties({
	userId: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);
