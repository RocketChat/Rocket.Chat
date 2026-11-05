import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

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
