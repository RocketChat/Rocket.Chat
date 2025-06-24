import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import OutboundMessageUpsellModal from './OutboundMessageUpsellModal';

export default {
	title: 'Outbound Message/OutboundMessageUpsellModal',
	component: OutboundMessageUpsellModal,
	args: {
		onClose: action('onClose'),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof OutboundMessageUpsellModal>;

type Story = StoryObj<typeof OutboundMessageUpsellModal>;

export const Default: Story = {
	args: {
		hasModule: false,
		isAdmin: false,
	},
};

export const WithModuleForAdmin: Story = {
	args: {
		hasModule: true,
		isAdmin: true,
	},
};

export const WithModuleForNonAdmin: Story = {
	args: {
		hasModule: true,
		isAdmin: false,
	},
};
