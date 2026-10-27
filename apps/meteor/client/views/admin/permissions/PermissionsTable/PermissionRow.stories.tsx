import type { IPermission, IRole } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { GenericTable, GenericTableBody } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import PermissionRow from './PermissionRow';

const roleList = [
	{ _id: 'admin', name: 'admin', description: 'Admin' },
	{ _id: 'moderator', name: 'moderator', description: 'Moderator' },
	{ _id: 'user', name: 'user', description: 'User' },
] as IRole[];

export default {
	component: PermissionRow,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<Box maxWidth='x640'>
						<GenericTable>
							<GenericTableBody>
								<Story />
							</GenericTableBody>
						</GenericTable>
					</Box>
				</AppRoot>
			);
		},
	],
	args: {
		roleList,
		onGrant: async () => undefined,
		onRemove: async () => undefined,
	},
} satisfies Meta<typeof PermissionRow>;

type Story = StoryObj<typeof PermissionRow>;

export const Default: Story = {
	args: {
		permission: { _id: 'view-logs', roles: ['admin', 'moderator'] } as IPermission,
	},
};
