import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

export type GroupsRenameProps = GroupsBaseProps & { name: string };
const groupsRenamePropsSchema = withGroupBaseProperties(
	{
		name: {
			type: 'string',
		},
	},
	['name'],
);
export const isGroupsRenameProps = ajv.compile<GroupsRenameProps>(groupsRenamePropsSchema);
