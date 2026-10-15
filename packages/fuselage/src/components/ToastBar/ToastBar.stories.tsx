import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';

import ToastBar from './ToastBar';

export default {
	title: 'Feedback/ToastBar',
	component: ToastBar,
	parameters: {
		docs: {
			description: {
				component:
					'A user-level, time-based notification that communicates the status of a performed action. Can be dismissed and may contain links. Disappears after a minimum of 5 seconds.\n\n' +
					'**Rules**\n' +
					'- Use only for brief action feedback — never for a persistent condition or a decision.\n' +
					'- Keep copy concise.\n' +
					'- For success, be explicit about the action and avoid "successfully"/exclamation marks (e.g. "Link copied", not "Copied!").\n' +
					'- For errors, include how to resolve the issue in a second line.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Message content shown inside the toast.',
		},
		variant: {
			control: 'select',
			options: ['info', 'success', 'error'],
			description: "Color kind and icon used for the toast; also determines the announcement role ('alert' for error, 'status' otherwise).",
			table: { defaultValue: { summary: 'info' } },
		},
		time: {
			control: 'number',
			description: 'Duration, in seconds, of the progress bar animation.',
			table: { defaultValue: { summary: '5' } },
		},
		isPaused: {
			control: 'boolean',
			description: 'Pauses the progress bar animation.',
		},
		id: {
			control: 'text',
			description: 'Identifier passed to `onClose` when the toast is dismissed.',
		},
		buttonLabel: {
			control: 'text',
			description: 'Accessible label for the close button.',
			table: { defaultValue: { summary: 'Dismiss alert' } },
		},
		onClose: {
			control: false,
			description: 'Called with the toast id when the close button is clicked; renders the close button when provided.',
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
