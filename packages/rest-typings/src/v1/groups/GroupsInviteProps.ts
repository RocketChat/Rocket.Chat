import { ajv } from '../Ajv';

import type { GroupsBaseProps } from './BaseProps';
import { withGroupBaseProperties } from './BaseProps';

export type GroupsInviteProps = GroupsBaseProps & { userId: string; unbanBeforeAdd?: boolean };

const groupsInviteSchema = withGroupBaseProperties(
	{
		userId: {
			type: 'string',
		},
		unbanBeforeAdd: {
			type: 'boolean',
			nullable: true,
		},
	},
	['userId'],
);

export const isGroupsInviteProps = ajv.compile<GroupsInviteProps>(groupsInviteSchema);
