import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


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
