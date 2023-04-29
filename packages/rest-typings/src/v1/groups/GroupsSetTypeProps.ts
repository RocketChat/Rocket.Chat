import { ajv } from '../../helpers/schemas';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

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
