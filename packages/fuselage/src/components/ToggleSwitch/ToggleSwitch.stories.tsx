import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';

import ToggleSwitch from './ToggleSwitch';
import { DECORATOR_LABEL, PropsVariationSection } from '../../../.storybook/helpers';

export default {
	title: 'Inputs/ToggleSwitch',
	component: ToggleSwitch,
	parameters: {
		docs: {
			description: {
				component:
					'Lets users quickly switch between two mutually exclusive states with instant feedback.\n\n' +
					'**Rules**\n' +
					'- Use when there are exactly two choices, such as enabling/disabling a setting.\n' +
					"- The change applies immediately — do not use a toggle when you don't want the interface affected right away (use a checkbox with an explicit save action instead).",
			},
		},
	},
	argTypes: {
		labelChildren: {
			control: false,
			description: 'Content rendered inside the label, before the switch.',
		},
		checked: {
			control: 'boolean',
			description: 'Whether the switch is on.',
		},
		disabled: {
			control: 'boolean',
			description: 'Disables the switch and blocks pointer interaction.',
		},
		onChange: {
			control: false,
			description: 'Called when the switch is toggled.',
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
				hover: { className: 'is-hovered' },
				active: { className: 'is-active' },
				focus: { className: 'is-focused' },
				disabled: { disabled: true },
			}}
		/>
	),
};
