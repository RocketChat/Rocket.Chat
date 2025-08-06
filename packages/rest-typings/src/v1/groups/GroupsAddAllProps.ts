import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../Ajv';

export type GroupsAddAllProps = GroupsBaseProps & {
	activeUsersOnly?: 'true' | 'false' | 1 | 0;
};
const groupsAddAllPropsSchema = withGroupBaseProperties({
	activeUsersOnly: {
		type: 'boolean',
		nullable: true,
	},
});
export const isGroupsAddAllProps = ajv.compile<GroupsAddAllProps>(groupsAddAllPropsSchema);
