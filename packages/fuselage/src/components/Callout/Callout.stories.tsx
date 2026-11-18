import type { Meta, StoryFn, StoryObj } from '@storybook/react';

import { Button, ButtonGroup, Callout } from '../..';

export default {
	title: 'Feedback/Callout',
	component: Callout,
	parameters: {
		docs: {
			usage: `
- Use only for a status that lasts until it changes: the user can't dismiss a \`Callout\`.
- Always give it a description (\`children\`); the \`title\` is optional.
- Name the event and the object it affects, in as few words as possible.
- When the notification needs a decision, use a \`Callout\` with \`actions\`, not a \`Banner\`.
`,
		},
	},
	argTypes: {
		type: {
			control: 'select',
			options: ['info', 'success', 'warning', 'danger'],
			table: { category: 'Kind' },
		},
		title: {
			control: 'text',
			table: { category: 'Content' },
		},
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		icon: {
			control: 'text',
			table: { category: 'Content' },
		},
		actions: {
			control: false,
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof Callout>;

type Story = StoryObj<typeof Callout>;

const Template: StoryFn<typeof Callout> = (args) => <Callout {...args}>{args.children || 'This is a generic description.'}</Callout>;

export const Default: Story = {
	render: Template,
	args: {
		title: 'This is a generic title',
	},
};

export const WithDescriptionOnly: Story = {
	render: Template,
};

export const Info: Story = {
	render: Template,
	args: {
		type: 'info',
		title: 'This is a info message',
	},
};

export const Success: Story = {
	render: Template,
	args: {
		type: 'success',
		title: 'This is a success message',
	},
};

export const Warning: Story = {
	render: Template,
	args: {
		type: 'warning',
		title: 'This is a warning message',
	},
};

export const Danger: Story = {
	render: Template,
	args: {
		type: 'danger',
		title: 'This is a danger message',
	},
};

export const CustomIcon: Story = {
	render: Template,
	args: {
		title: 'This is a message with custom icon',
		icon: 'hash',
	},
};

export const WithActions: Story = {
	args: {
		title: 'This is a generic title',
		children: 'This is a generic description.',
		actions: (
			<ButtonGroup>
				<Button size='small'>Button</Button>
				<Button size='small'>Button</Button>
			</ButtonGroup>
		),
	},
};
