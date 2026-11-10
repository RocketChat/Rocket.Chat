import type { Meta, StoryObj } from '@storybook/react-webpack5';

import MessageDivider from './MessageDivider';
import { Box } from '../../Box';

export default {
	title: 'Message/MessageDivider',
	component: MessageDivider,
	parameters: {
		docs: {
			description: {
				component:
					'Separates message sections, appearing above them.\n\n' +
					'**Rules**\n' +
					'- Use the date to mark when messages were sent; use the unread indicator to highlight new messages.\n' +
					'- Omit the divider line itself for longer messages likely to wrap multiple lines.',
			},
		},
	},
	argTypes: {
		children: {
			control: 'text',
			description: 'Label rendered in the divider bar, e.g. a date.',
			table: { category: 'Content' },
		},
		unreadLabel: {
			control: 'text',
			description: 'Label rendered on the trailing bar; when set, switches the divider to its unread styling.',
			table: { category: 'Content' },
		},
	},
} satisfies Meta<typeof MessageDivider>;

type Story = StoryObj<typeof MessageDivider>;

export const Default: Story = {
	render: () => (
		<Box>
			<MessageDivider>Text</MessageDivider>
			<MessageDivider unreadLabel='Unread'>Text</MessageDivider>
			<MessageDivider unreadLabel='Unread' />
		</Box>
	),
};
