import type { Meta, StoryObj } from '@storybook/react';

import Label from './Label';
import { LabelInfo } from './LabelInfo';

export default {
	title: 'Inputs/Label',
	component: Label,
	parameters: {
		docs: {
			usage: `
- Use a \`Label\` on its own to name a \`CheckBox\`, \`RadioButton\` or \`ToggleSwitch\`; in a \`Field\`, use a \`FieldLabel\`.
- Describe the information needed with a specific label. Avoid generic labels, and don't assign ownership when it isn't needed.
- Set \`required\` on the label of every required input.
- Add a \`FieldLabelInfo\` only when the field needs an explanation in a tooltip.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		is: {
			control: 'text',
			table: { category: 'Polymorphism' },
		},
		required: {
			control: 'boolean',
			table: { category: 'State' },
		},
		disabled: {
			control: 'boolean',
			table: { category: 'State' },
		},
	},
} satisfies Meta<typeof Label>;

type Story = StoryObj<typeof Label>;

export const Default: Story = {
	args: {
		children: 'Label',
	},
};

export const Required: Story = {
	args: {
		children: 'Label',
		required: true,
	},
};

export const Info: Story = {
	render: (args) => (
		<Label {...args}>
			Label
			<LabelInfo title='this is a label info' />
		</Label>
	),
};

export const InfoRequired: Story = {
	args: {
		required: true,
	},
	render: (args) => (
		<Label {...args}>
			Label
			<LabelInfo title='this is a label info' />
		</Label>
	),
};

export const Disabled: Story = {
	args: {
		children: 'Label',
		disabled: true,
	},
};
