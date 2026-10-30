import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import CheckBox from './CheckBox';
import { DECORATOR_LABEL, PropsVariationSection, variationPseudoStates } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/CheckBox',
	component: CheckBox,
	parameters: {
		docs: {
			description: {
				component:
					'Allows users to select one or more options from a list. Unlike radio buttons and switches, it also supports an indeterminate state for groups with partial selection.\n\n' +
					'**Rules**\n' +
					'- Use a checkbox when more than one option can be selected, or for a single opt-in such as accepting terms of service.\n' +
					'- Use the indeterminate state only for a parent controlling a group with partial selection.',
			},
		},
	},
	argTypes: {
		checked: {
			control: 'boolean',
			description: 'Whether the checkbox is checked (controlled).',
			table: { category: 'State' },
		},
		defaultChecked: {
			control: 'boolean',
			description: 'Whether the checkbox is checked initially (uncontrolled).',
			table: { category: 'State' },
		},
		indeterminate: {
			control: 'boolean',
			description: 'Renders the checkbox in an indeterminate visual state, regardless of its checked value.',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the checkbox and blocks pointer interaction.',
			table: { category: 'State' },
		},
		labelChildren: {
			control: false,
			description: 'Content rendered before the checkbox input, inside its label.',
			table: { category: 'Content', disable: true },
		},
		onChange: {
			control: false,
			description: 'Called when the checked state changes.',
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
	parameters: { pseudo: variationPseudoStates },
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
