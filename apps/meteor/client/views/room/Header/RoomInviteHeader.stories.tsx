import type { Meta, StoryObj } from '@storybook/react';

import RoomInviteHeader from './RoomInviteHeader';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockedRoom = createFakeRoom({ name: 'rocket.cat', federated: true });

const meta = {
	component: RoomInviteHeader,
	args: {
		room: mockedRoom,
	},
	decorators: [(story) => <FakeRoomProvider roomOverrides={mockedRoom}>{story()}</FakeRoomProvider>],
} satisfies Meta<typeof RoomInviteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
