import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';
import { userEvent, within } from 'storybook/test';

import CreateDirectMessage from './CreateDirectMessage';

export default {
	component: CreateDirectMessage,
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot()
				.withSetting('DirectMesssage_maxUsers', 8)
				.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [], count: 0, offset: 0, total: 0, success: true }) as any)
				.build();
			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	args: {
		onClose: action('onClose'),
	},
} satisfies Meta<typeof CreateDirectMessage>;

type Story = StoryObj<typeof CreateDirectMessage>;

export const Default: Story = {};

export const WithFocusedField: Story = {
	play: async ({ canvasElement }) => {
		await userEvent.click(within(canvasElement.ownerDocument.body).getByRole('textbox'));
	},
};
