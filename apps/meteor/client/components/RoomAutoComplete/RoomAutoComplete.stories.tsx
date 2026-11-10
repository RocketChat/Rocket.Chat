import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';

import RoomAutoComplete from './RoomAutoComplete';

export default {
	component: RoomAutoComplete,
	parameters: {
		layout: 'padded',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate', () => ({
					items: [
						{ _id: 'general', name: 'general', t: 'c' },
						{ _id: 'design', name: 'design', t: 'p' },
					] as any,
				}))
				.build();
			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
} satisfies Meta<typeof RoomAutoComplete>;

type Story = StoryObj<typeof RoomAutoComplete>;

export const WithSelectedRoom: Story = {
	render: function Render(args) {
		const [value, setValue] = useState('');
		return <RoomAutoComplete {...args} value={value} onChange={(newValue) => setValue(newValue as string)} />;
	},
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement).getByRole('textbox'));
		await userEvent.click(await within(document.body).findByRole('option', { name: /general/ }));
		(document.activeElement as HTMLElement | null)?.blur();
	},
};
