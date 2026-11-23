import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsSetTypeProps = GroupsBaseProps & { type: string };
const groupsSetTypePropsSchema = withGroupBaseProperties(
	{
		type: {
			type: 'string',
		},
	},
	['type'],
);
export const isGroupsSetTypeProps = ajv.compile<GroupsSetTypeProps>(groupsSetTypePropsSchema);
