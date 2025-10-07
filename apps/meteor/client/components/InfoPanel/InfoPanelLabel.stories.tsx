import type { Meta, StoryObj } from '@storybook/react';

import InfoPanelLabel from './InfoPanelLabel';

const meta: Meta<typeof InfoPanelLabel> = {
	component: InfoPanelLabel,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'Title text for the info icon tooltip',
		},
		children: {
			control: 'text',
			description: 'Content to display in the label',
		},
	},
};

export default meta;
type Story = StoryObj<typeof InfoPanelLabel>;

export const Default: Story = {
	args: {
		children: 'Default label content',
	},
};

export const WithTitle: Story = {
	args: {
		title: 'This is helpful information about the label',
		children: 'Label with info icon',
	},
};
