import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';
import { ajv } from '../Ajv';

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
