import type { Meta, StoryObj } from '@storybook/react';

import RoomHeader from './RoomHeader';
import FakeRoomProvider from '../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeRoom } from '../../../../tests/mocks/data';

const mockedChannel = createFakeRoom({ t: 'c', name: 'general' });
const mockedDM = createFakeRoom({ t: 'd', name: 'rocket.cat' });

const meta = {
	component: RoomHeader,
	args: {
		room: mockedChannel,
	},
	decorators: [
		(story) => (
			<FakeRoomProvider roomOverrides={mockedChannel}>
				{story()}
			</FakeRoomProvider>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof RoomHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default RoomHeader for a channel room.
 * Renders with the default RoomToolbox in the toolbar area.
 */
export const Default: Story = {};

/**
 * RoomHeader with the toolbox explicitly hidden.
 * Used in contexts like the room invite view.
 */
export const WithToolboxHidden: Story = {
	args: {
		slots: {
			toolbox: {
				hidden: true,
			},
		},
	},
};

/**
 * RoomHeader with custom content injected into the toolbox slot.
 * Demonstrates the slot-based extensibility of the header.
 */
export const WithCustomToolboxContent: Story = {
	args: {
		slots: {
			toolbox: {
				content: (
					<div style={{ padding: '0 8px', color: '#6C727A', fontSize: '14px' }}>
						Custom Actions Here
					</div>
				),
			},
		},
	},
};

/**
 * RoomHeader with pre and pos toolbox slots populated.
 * Shows how additional content can be injected around the toolbox.
 */
export const WithToolboxPreAndPosSlots: Story = {
	args: {
		slots: {
			toolbox: {
				pre: (
					<div style={{ padding: '0 4px', fontSize: '12px', color: '#2F343D' }}>
						[Pre]
					</div>
				),
				pos: (
					<div style={{ padding: '0 4px', fontSize: '12px', color: '#2F343D' }}>
						[Pos]
					</div>
				),
			},
		},
	},
};

/**
 * RoomHeader for a direct message room type.
 */
export const DirectMessage: Story = {
	args: {
		room: mockedDM,
	},
	decorators: [
		(story) => (
			<FakeRoomProvider roomOverrides={mockedDM}>
				{story()}
			</FakeRoomProvider>
		),
	],
};
