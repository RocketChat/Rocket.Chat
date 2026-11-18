import type { Meta, StoryObj } from '@storybook/react';

import FramedIcon from './FramedIcon';

export default {
	title: 'Data Display/FramedIcon',
	component: FramedIcon,
	parameters: {
		docs: {
			usage: `
- Always place it beside text, never on its own.
- Don't use it for actions: use an \`IconButton\` instead.
- Don't mix colors in the same context.
`,
		},
	},
	argTypes: {
		icon: {
			control: 'text',
			table: { category: 'Content' },
		},
		info: {
			control: 'boolean',
			table: { category: 'Kind' },
		},
		success: {
			control: 'boolean',
			table: { category: 'Kind' },
		},
		warning: {
			control: 'boolean',
			table: { category: 'Kind' },
		},
		danger: {
			control: 'boolean',
			table: { category: 'Kind' },
		},
		neutral: {
			control: 'boolean',
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
