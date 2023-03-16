import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsCountersProps = GroupsBaseProps & { userId?: string };

const GroupsCountersPropsSchema = withGroupBaseProperties({
	userId: {
		type: 'string',
		nullable: true,
	},
});

export const isGroupsCountersProps = ajv.compile<GroupsCountersProps>(GroupsCountersPropsSchema);
