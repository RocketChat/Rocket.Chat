import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import RadioButton from './RadioButton';
import { PropsVariationSection, DECORATOR_LABEL } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/RadioButton',
	component: RadioButton,
	parameters: {
		docs: {
			description: {
				component:
					'Allows users to select only one option from a set of mutually exclusive options.\n\n' +
					'**Rules**\n' +
					'- Use only for a single choice from a small set of mutually exclusive options.\n' +
					'- Avoid when the number of choices is large — consider another control.\n' +
					'- Do not add links to the radio label.\n' +
					'- Do not use for accepting terms of service or similar — use a checkbox instead.',
			},
		},
	},
	argTypes: {
		checked: {
			control: 'boolean',
			description: 'Whether the radio button is checked (controlled).',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the radio button and blocks pointer interaction.',
			table: { category: 'State' },
		},
		labelChildren: {
			control: false,
			description: 'Content rendered before the radio input, inside its label.',
			table: { category: 'Content' },
		},
		onChange: {
			control: false,
			description: 'Called when the checked state changes.',
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
				hover: { className: 'is-hovered' },
				active: { className: 'is-active' },
				focus: { className: 'is-focused' },
				disabled: { disabled: true },
			}}
		/>
	),
};
