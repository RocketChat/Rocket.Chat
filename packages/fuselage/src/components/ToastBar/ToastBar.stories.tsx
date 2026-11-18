import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ToastBar from './ToastBar';

export default {
	title: 'Feedback/ToastBar',
	component: ToastBar,
	parameters: {
		docs: {
			usage: `
- Use only for brief feedback on an action, never for a lasting condition or a decision.
- Keep a toast on screen for at least 5 seconds.

**Messages**

- Keep them short.
- For \`success\`, name the action, without "successfully" or exclamation marks ("Link copied", not "Copied!").
- For \`error\`, add a second line that says how to resolve the issue.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
		},
		variant: {
			control: 'select',
			options: ['info', 'success', 'error'],
			table: { defaultValue: { summary: 'info' } },
		},
		time: {
			control: 'number',
			table: { defaultValue: { summary: '5' } },
		},
		isPaused: {
			control: 'boolean',
		},
		id: {
			control: 'text',
		},
		buttonLabel: {
			control: 'text',
			table: { defaultValue: { summary: 'Dismiss alert' } },
		},
		onClose: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof ToastBar>;

type Story = StoryObj<typeof ToastBar>;

export const Default: Story = {
	args: {
		children:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod\n  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,\n  quis nostrud exercitation ullamco',
	},
};

export const Success: Story = {
	args: {
		...Default.args,
		variant: 'success',
	},
};

export const Error: Story = {
	args: {
		...Default.args,
		variant: 'error',
	},
};

export const WithCloseButton: Story = {
	args: {
		...Default.args,
		onClose: action('clicked'),
	},
};

export const TinyText: Story = {
	args: {
		children: 'Lorem ipsum dolor sit amet',
	},
};
