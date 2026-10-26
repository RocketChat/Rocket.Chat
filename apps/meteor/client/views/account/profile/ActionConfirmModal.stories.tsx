import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ActionConfirmModal from './ActionConfirmModal';

export default {
	component: ActionConfirmModal,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => {
			const AppRoot = mockAppRoot().build();
			return (
				<AppRoot>
					<Story />
				</AppRoot>
			);
		},
	],
	args: {
		onConfirm: async () => action('onConfirm')(),
		onCancel: action('onCancel'),
	},
} satisfies Meta<typeof ActionConfirmModal>;

type Story = StoryObj<typeof ActionConfirmModal>;

export const WithPassword: Story = {
	args: { isPassword: true },
};

export const WithUsername: Story = {
	args: { isPassword: false },
};
