import type { Meta, StoryObj } from '@storybook/react';

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
			table: { category: 'Content' },
		},
		align: {
			control: 'select',
			options: ['start', 'center', 'end'],
			table: { category: 'Layout', defaultValue: { summary: 'start' } },
		},
		stretch: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		wrap: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		vertical: {
			control: 'boolean',
			table: { category: 'Layout' },
		},
		small: {
			control: 'boolean',
			table: { category: 'Size', defaultValue: { summary: 'true' } },
		},
		large: {
			control: 'boolean',
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
