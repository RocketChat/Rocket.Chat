import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

export type GroupsSetReadOnlyProps = GroupsBaseProps & { readOnly: boolean };
const groupsSetReadOnlyPropsSchema = withGroupBaseProperties(
	{
		readOnly: {
			type: 'boolean',
		},
	},
	['readOnly'],
);
export const isGroupsSetReadOnlyProps = ajv.compile<GroupsSetReadOnlyProps>(groupsSetReadOnlyPropsSchema);
