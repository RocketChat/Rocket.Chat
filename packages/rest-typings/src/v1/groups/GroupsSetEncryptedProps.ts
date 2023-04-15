import Ajv from 'ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

const ajv = new Ajv({
	coerceTypes: true,
});

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
