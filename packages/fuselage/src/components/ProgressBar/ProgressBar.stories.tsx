import type { Meta, StoryObj } from '@storybook/react';

import ProgressBar from './ProgressBar';

export default {
	title: 'Data Display/ProgressBar',
	component: ProgressBar,
	parameters: {
		docs: {
			usage: `
- Pick the \`variant\` (\`info\`, \`success\`, \`warning\`, \`danger\`) for the state of the progress or consumption.
`,
		},
	},
	argTypes: {
		percentage: {
			control: { type: 'number', min: 0, max: 100 },
			table: { category: 'Content' },
		},
		variant: {
			control: 'select',
			options: ['info', 'success', 'warning', 'danger'],
			table: { category: 'Kind', defaultValue: { summary: 'info' } },
		},
		error: {
			control: 'text',
			table: { category: 'State' },
		},
		animated: {
			control: 'boolean',
			table: { category: 'State' },
		},
		light: {
			control: 'boolean',
			table: { category: 'Appearance' },
		},
	},
} satisfies Meta<typeof ProgressBar>;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
	args: {
		percentage: 30,
	},
};

export const Success: Story = {
	args: {
		percentage: 100,
		variant: 'success',
	},
};

export const Warning: Story = {
	args: {
		percentage: 60,
		variant: 'warning',
	},
};

export const Danger: Story = {
	args: {
		percentage: 100,
		variant: 'danger',
	},
};

export const Animated: Story = {
	args: {
		percentage: 80,
		animated: true,
	},
};

export const Error: Story = {
	args: {
		percentage: 21,
		error: 'Error Downloading File',
	},
};

export const DefaultLight: Story = {
	args: {
		percentage: 70,
		light: true,
	},
};

export const SuccessLight: Story = {
	args: {
		percentage: 100,
		variant: 'success',
		light: true,
	},
};

export const WarningLight: Story = {
	args: {
		percentage: 60,
		variant: 'warning',
		light: true,
	},
};

export const DangerLight: Story = {
	args: {
		percentage: 100,
		variant: 'danger',
		light: true,
	},
};

export const ErrorLight: Story = {
	args: {
		percentage: 20,
		error: 'Error downloading file',
		light: true,
	},
};
