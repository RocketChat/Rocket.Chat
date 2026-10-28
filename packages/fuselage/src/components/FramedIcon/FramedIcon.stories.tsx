import type { Meta, StoryObj } from '@storybook/react-vite';

import FramedIcon from './FramedIcon';

export default {
	title: 'Data Display/FramedIcon',
	component: FramedIcon,
	parameters: {
		docs: {
			description: {
				component:
					'Draws attention to a specific UI element with an icon inside a rectangular frame; communicates system state.\n\n' +
					'**Rules**\n' +
					'- Always use alongside text, never standalone.\n' +
					'- Not for user actions — use the Icon button for actions.\n' +
					'- Do not mix multiple color types in the same context.',
			},
		},
	},
	argTypes: {
		icon: {
			control: 'text',
			description: 'Name of the Fuselage icon rendered inside the frame.',
			table: { category: 'Content' },
		},
		info: {
			control: 'boolean',
			description: 'Applies the info (blue) color kind to the frame.',
			table: { category: 'Kind' },
		},
		success: {
			control: 'boolean',
			description: 'Applies the success (green) color kind to the frame.',
			table: { category: 'Kind' },
		},
		warning: {
			control: 'boolean',
			description: 'Applies the warning (yellow) color kind to the frame.',
			table: { category: 'Kind' },
		},
		danger: {
			control: 'boolean',
			description: 'Applies the danger (red) color kind to the frame.',
			table: { category: 'Kind' },
		},
		neutral: {
			control: 'boolean',
			description: 'Applies the neutral color kind explicitly; used by default when no other kind is set.',
			table: { category: 'Kind' },
		},
	},
} satisfies Meta<typeof FramedIcon>;

type Story = StoryObj<typeof FramedIcon>;

export const Default: Story = {
	args: {
		icon: 'rocket',
	},
};

export const Info: Story = {
	args: {
		icon: 'rocket',
		info: true,
	},
};

export const Success: Story = {
	args: {
		icon: 'rocket',
		success: true,
	},
};

export const Warning: Story = {
	args: {
		icon: 'rocket',
		warning: true,
	},
};

export const Danger: Story = {
	args: {
		icon: 'rocket',
		danger: true,
	},
};
