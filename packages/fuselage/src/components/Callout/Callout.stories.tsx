import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';

import { Button, ButtonGroup, Callout } from '../..';
import { setStoryDescription } from '../../helpers/setStoryDescription';

export default {
	title: 'Feedback/Callout',
	component: Callout,
	parameters: {
		docs: {
			description: {
				component:
					'A non-time-based notification (system- or user-level) that cannot be dismissed by the user and persists until its status changes. May contain links.\n\n' +
					'**Rules**\n' +
					'- Cannot be dismissed by the user — use only for status that persists until it changes.\n' +
					'- Description is mandatory; icon and title are optional.\n' +
					'- Make copy concise while explicitly naming the event and the affected object.\n' +
					'- A Callout CAN carry action buttons — use it (not a Banner) when the notification needs a decision.',
			},
		},
	},
	argTypes: {
		type: {
			control: 'select',
			options: ['info', 'success', 'warning', 'danger'],
			description: 'Semantic kind of the callout. Drives the default icon and color styling.',
			table: { category: 'Kind' },
		},
		title: {
			control: 'text',
			description: 'Title shown above the callout content.',
			table: { category: 'Content' },
		},
		children: {
			control: 'text',
			description: 'Description content of the callout.',
			table: { category: 'Content' },
		},
		icon: {
			control: 'text',
			description: 'Name of the icon rendered instead of the `type`-based default icon.',
			table: { category: 'Content' },
		},
		actions: {
			control: false,
			description: 'Content (e.g. a ButtonGroup) rendered in the actions area.',
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
	parameters: setStoryDescription('Communicates that an important aspect of the system is working as expected.'),
};

export const Warning: Story = {
	render: Template,
	args: {
		type: 'warning',
		title: 'This is a warning message',
	},
	parameters: setStoryDescription('Communicates that an important aspect of the system needs attention.'),
};

export const Danger: Story = {
	render: Template,
	args: {
		type: 'danger',
		title: 'This is a danger message',
	},
	parameters: setStoryDescription(
		'Communicates that an important aspect of the system is not working as expected and requires urgent action.',
	),
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
				<Button small>Button</Button>
				<Button small>Button</Button>
			</ButtonGroup>
		),
	},
};
