import type { Meta, StoryObj } from '@storybook/react';

import MessageDivider from './MessageDivider';
import { Box } from '../../Box';

export default {
	title: 'Message/MessageDivider',
	component: MessageDivider,
	parameters: {
		docs: {
			usage: `
- Place the divider above the messages it introduces.
- Pass the date as \`children\` to mark when the messages below were sent, and set \`unreadLabel\` to mark where new messages start.
- Leave the divider line out for longer messages likely to wrap onto several lines.
`,
		},
	},
	argTypes: {
		children: {
			control: 'text',
			table: { category: 'Content' },
		},
		unreadLabel: {
			control: 'text',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof MessageDivider>;

type Story = StoryObj<typeof MessageDivider>;

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story: 'A date, a date that also marks where unread messages start, and an unread marker alone.',
			},
		},
	},
	render: () => (
		<Box>
			<MessageDivider>Text</MessageDivider>
			<MessageDivider unreadLabel='Unread'>Text</MessageDivider>
			<MessageDivider unreadLabel='Unread' />
		</Box>
	),
};
