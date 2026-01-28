import { ajv } from '../Ajv';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

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
