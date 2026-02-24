import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import RoomFormAutocomplete from './RoomFormAutocomplete';
import { createFakeRoom } from '../../../../../tests/mocks/data';

const mockRoom1 = createFakeRoom({ t: 'p', name: 'Room 1' });
const mockRoom2 = createFakeRoom({ t: 'p', name: 'Room 2' });

const meta: Meta<typeof RoomFormAutocomplete> = {
	component: RoomFormAutocomplete,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withEndpoint('GET', '/v1/rooms.adminRooms', () => ({
					rooms: [mockRoom1 as any, mockRoom2 as any],
					count: 2,
					offset: 0,
					total: 2,
				}))
				.build();
			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	args: {
		value: '',
		onSelectedRoom: action('onChange'),
	},
};

export default meta;
type Story = StoryObj<typeof RoomFormAutocomplete>;

export const Default: Story = {};
