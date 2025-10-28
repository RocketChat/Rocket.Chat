import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsSetPurposeProps = GroupsBaseProps & { purpose: string };
const groupsSetPurposePropsSchema = withGroupBaseProperties(
	{
		purpose: {
			type: 'string',
		},
	},
	['purpose'],
);
export const isGroupsSetPurposeProps = ajv.compile<GroupsSetPurposeProps>(groupsSetPurposePropsSchema);
