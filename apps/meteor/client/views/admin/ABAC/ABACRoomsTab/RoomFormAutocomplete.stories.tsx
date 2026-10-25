import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

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

export const WithSelectedRoom: Story = {
	render: function Render(args) {
		const [value, setValue] = useState('');
		return <RoomFormAutocomplete {...args} value={value} onSelectedRoom={(newValue) => setValue(newValue)} />;
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole('textbox'));
		await userEvent.click(await within(document.body).findByRole('option', { name: /Room 1/ }));
		(document.activeElement as HTMLElement | null)?.blur();
	},
};
