import { ajv } from '../Ajv.js';
import type { GroupsBaseProps } from './BaseProps.js';
import { withGroupBaseProperties } from './BaseProps.js';

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
