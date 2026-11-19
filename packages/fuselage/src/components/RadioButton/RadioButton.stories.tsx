import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import RadioButton from './RadioButton';
import { DECORATOR_LABEL, PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/RadioButton',
	component: RadioButton,
	parameters: {
		docs: {
			usage: `
- Use a \`RadioButton\` for a single choice from a small set of mutually exclusive options.
- Avoid it when there are many choices: they clutter the screen and make picking one harder.
- Don't put links in its label.
- Don't use it to accept terms of service or anything similar; use a \`CheckBox\` instead.
`,
		},
	},
	argTypes: {
		checked: {
			control: 'boolean',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
		labelChildren: {
			control: false,
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			table: { category: 'Events' },
		},
	},
} satisfies Meta<typeof RadioButton>;

type Story = StoryObj<typeof RadioButton>;

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
			component={RadioButton}
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
