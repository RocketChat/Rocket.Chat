import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { SidePanelInternal } from './SidePanelInternal';

type DemoRoom = { _id: string; name: string };

const DemoRoomItem = ({ room, openedRoom }: { room: DemoRoom; openedRoom: string | undefined; isRoomFilter: boolean }) => (
	<a href={`/room/${room._id}`} aria-current={openedRoom === room._id ? 'page' : undefined}>
		{room.name}
	</a>
);

const meta = {
	component: SidePanelInternal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		title: 'Rooms',
		currentTab: 'all',
		unreadOnly: false,
		toggleUnreadOnly: action('toggleUnreadOnly'),
		ItemContentComponent: DemoRoomItem,
	},
} satisfies Meta<typeof SidePanelInternal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		rooms: [
			{ _id: 'room-1', name: 'Alpha' },
			{ _id: 'room-2', name: 'Beta' },
		],
	},
};

export const Empty: Story = {
	args: {
		rooms: [],
	},
};
