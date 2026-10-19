import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Box } from '../../Box';
import { BasicMessageTemplate } from '../helpers';
import MessageToolbar from './MessageToolbar';
import MessageToolbarItem from './MessageToolbarItem';

export default {
	title: 'Message/MessageToolbar',
	component: MessageToolbar,
	subcomponents: {
		MessageToolbarItem,
	},
	argTypes: {
		children: {
			control: false,
			description: 'Toolbar buttons, composed from MessageToolbarItem.',
			table: { category: 'Content' },
		},
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			description: 'Horizontal alignment of the toolbar items.',
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'boolean',
			description: 'Stretches items to fill the available width.',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			description: 'Allows items to wrap onto multiple lines.',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			description: 'Stacks items vertically instead of horizontally.',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			description: 'Small size scale for the toolbar items.',
			table: { category: 'Size', defaultValue: { summary: 'true' } },
		},
		large: {
			control: 'boolean',
			description: 'Large size scale for the toolbar items.',
			table: { category: 'Size' },
		},
	},
} satisfies Meta<typeof MessageToolbar>;

type Story = StoryObj<typeof MessageToolbar>;

const toolbar = (
	<Box>
		<MessageToolbar>
			<MessageToolbarItem title='Quote' icon='quote' />
			<MessageToolbarItem title='Emoji' icon='emoji' />
			<MessageToolbarItem title='Thread' icon='thread' />
			<MessageToolbarItem title='Menu' icon='menu' />
		</MessageToolbar>
	</Box>
);

export const Default: Story = {
	render: () => <BasicMessageTemplate toolbar={toolbar} />,
};
