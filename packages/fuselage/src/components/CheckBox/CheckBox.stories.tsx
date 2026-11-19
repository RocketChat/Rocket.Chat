import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CheckBox from './CheckBox';
import { DECORATOR_LABEL, PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/CheckBox',
	component: CheckBox,
	parameters: {
		docs: {
			usage: `
- Use a \`CheckBox\` when more than one option can be selected, or for a single opt-in such as accepting terms of service.
- Set \`indeterminate\` only on a checkbox that controls a group where some options, but not all, are selected.
`,
		},
	},
	argTypes: {
		checked: {
			control: 'boolean',
			table: { category: 'State' },
		},
		defaultChecked: {
			control: 'boolean',
			table: { category: 'State' },
		},
		indeterminate: {
			control: 'boolean',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		labelChildren: {
			control: false,
			table: { category: 'Content', disable: true },
		},
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof CheckBox>;

type Story = StoryObj<typeof CheckBox>;

export const Default: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
	},
};

export const Checked: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
		'checked': true,
	},
};

export const Indeterminate: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
		'indeterminate': true,
	},
};

export const Disabled: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
		'disabled': true,
	},
};

export const DefaultChecked: Story = {
	args: {
		'aria-label': DECORATOR_LABEL,
		'onChange': action('change'),
		'defaultChecked': true,
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
			component={CheckBox}
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
