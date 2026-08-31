import { ajv } from '../Ajv';
import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsSetEncryptedProps = GroupsBaseProps & { encrypted: boolean };
const groupsSetEncryptedPropsSchema = withGroupBaseProperties(
	{
		encrypted: {
			type: 'boolean',
		},
	},
	['encrypted'],
);
export const isGroupsSetEncryptedProps = ajv.compile<GroupsSetEncryptedProps>(groupsSetEncryptedPropsSchema);
