import type { Meta, StoryObj } from '@storybook/react-webpack5';

import ProgressBar from './ProgressBar';

export default {
	title: 'Data Display/ProgressBar',
	component: ProgressBar,
	parameters: {
		docs: {
			description: {
				component:
					'Concisely presents consumption or progress statistics.\n\n' +
					'**Rules**\n' +
					'- Use the `variant` (info/success/warning/danger) to convey state according to consumption or progress.\n' +
					'- Note: the design system also documents a "+ info" variant (adding a label + counter) — this component does not implement that variant yet.',
			},
		},
	},
	argTypes: {
		percentage: {
			control: { type: 'number', min: 0, max: 100 },
			description: 'Percentage of the bar that is filled; clamped between 0 and 100.',
			table: { category: 'Content' },
		},
		variant: {
			control: 'select',
			options: ['info', 'success', 'warning', 'danger'],
			description: 'Color kind of the filled portion.',
			table: { category: 'Kind', defaultValue: { summary: 'info' } },
		},
		error: {
			control: 'text',
			description: 'Error message shown as a title tooltip; also forces the danger color, overriding `variant`.',
			table: { category: 'State' },
		},
		animated: {
			control: 'boolean',
			description: 'Animates the fill with a striped, moving pattern.',
			table: { category: 'State' },
		},
		light: {
			control: 'boolean',
			description: 'Uses the lighter background color kind instead of the font-on-color kind.',
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
