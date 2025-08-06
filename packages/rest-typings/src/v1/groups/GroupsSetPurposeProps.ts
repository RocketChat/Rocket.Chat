import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from './../Ajv';


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
