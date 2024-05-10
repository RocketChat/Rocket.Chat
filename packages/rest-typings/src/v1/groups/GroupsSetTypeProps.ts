import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

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
