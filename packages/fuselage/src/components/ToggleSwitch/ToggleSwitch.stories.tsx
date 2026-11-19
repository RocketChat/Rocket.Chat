import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ToggleSwitch from './ToggleSwitch';
import { DECORATOR_LABEL, PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/ToggleSwitch',
	component: ToggleSwitch,
	parameters: {
		docs: {
			usage: `
- Use a \`ToggleSwitch\` only for two choices, such as enabling or disabling a setting.
- It takes effect at once. When the screen shouldn't change until the user confirms, use a \`CheckBox\` and an explicit save action instead.
`,
		},
	},
	argTypes: {
		labelChildren: {
			control: false,
		},
		checked: {
			control: 'boolean',
		},
		disabled: {
			control: 'boolean',
		},
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof ToggleSwitch>;

type Story = StoryObj<typeof ToggleSwitch>;

export const Default: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
	},
};

export const Checked: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'checked': true,
		'onChange': action('change'),
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'disabled': true,
	},
};

export const States: Story = {
	parameters: {
		pseudo: variationPseudoStates,
		docs: {
			description: {
				story: 'Checked and unchecked, in each interaction state.',
			},
		},
	},
	render: () => (
		<PropsVariationSection
			component={ToggleSwitch}
			common={{ 'onChange': action('change'), 'aria-label': DECORATOR_LABEL }}
			xAxis={{
				checked: { checked: true },
				unchecked: { checked: false },
			}}
			yAxis={{
				default: {},
				hover: {},
				active: {},
				focus: {},
				disabled: { disabled: true },
			}}
		/>
	),
};
