import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CodeSnippet from './CodeSnippet';

export default {
	title: 'Data Display/CodeSnippet',
	component: CodeSnippet,
	parameters: {
		docs: {
			usage: `
- Use it to make server settings available to users as code they can copy and paste.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		buttonText: {
			control: 'text',
			table: { category: 'Content', defaultValue: { summary: 'Copy' } },
		},
		buttonDisabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		onClick: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof CodeSnippet>;

type Story = StoryObj<typeof CodeSnippet>;

export const Default: Story = {
	args: {
		children: 'curl -L https://go.rocket.chat/i/docker-compose.yml -O',
	},
};

export const CopyButton: Story = {
	args: {
		children: 'curl -L https://go.rocket.chat/i/docker-compose.yml -O',
		onClick: action('click'),
	},
};

export const CustomButtonName: Story = {
	args: {
		children: 'curl -L https://go.rocket.chat/i/docker-compose.yml -O',
		onClick: action('click'),
		buttonText: 'Custom name',
	},
};

export const LoadingCode: Story = {
	args: {
		children: '',
		onClick: action('click'),
	},
};

export const DisabledButton: Story = {
	args: {
		children: 'curl -L https://go.rocket.chat/i/docker-compose.yml -O',
		onClick: action('click'),
		buttonText: 'Disabled Button',
		buttonDisabled: true,
	},
};
