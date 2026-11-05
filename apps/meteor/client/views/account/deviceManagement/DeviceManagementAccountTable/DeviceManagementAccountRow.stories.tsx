import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { GenericTable, GenericTableBody } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';

import DeviceManagementAccountRow from './DeviceManagementAccountRow';

export default {
	component: DeviceManagementAccountRow,
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
		_id: 'session-1',
		deviceName: 'Chrome',
		deviceType: 'browser',
		deviceOSName: 'macOS',
		loginAt: '2026-10-20T10:00:00.000Z',
	},
} satisfies Meta<typeof DeviceManagementAccountRow>;

type Story = StoryObj<typeof DeviceManagementAccountRow>;

export const Default: Story = {};

export const Current: Story = {
	args: { current: true },
};

export const LongDeviceName: Story = {
	args: { deviceName: 'Rocket.Chat Desktop on a very long device name that does not fit' },
};
