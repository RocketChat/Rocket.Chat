import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../Ajv';

export type GroupsSetDescriptionProps = GroupsBaseProps & { description: string };
const groupsSetDescriptionPropsSchema = withGroupBaseProperties(
	{
		description: {
			type: 'string',
		},
	},
	['description'],
);
export const isGroupsSetDescriptionProps = ajv.compile<GroupsSetDescriptionProps>(groupsSetDescriptionPropsSchema);
