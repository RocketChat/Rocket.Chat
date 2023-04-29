import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../../helpers/schemas';

export type GroupsSetCustomFieldsProps = GroupsBaseProps & { customFields: Record<string, any> };
const groupsSetCustomFieldsPropsSchema = withGroupBaseProperties(
	{
		customFields: {
			type: 'object',
		},
	},
	['customFields'],
);
export const isGroupsSetCustomFieldsProps = ajv.compile<GroupsSetCustomFieldsProps>(groupsSetCustomFieldsPropsSchema);
