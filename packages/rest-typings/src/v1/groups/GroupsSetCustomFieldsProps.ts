import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

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
