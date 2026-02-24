import { ajv } from '../Ajv';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

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
