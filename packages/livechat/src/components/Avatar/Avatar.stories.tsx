import type { Meta, StoryObj } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Avatar } from '.';
import { gazzoAvatar } from '../../../.storybook/helpers';

export default {
	component: Avatar,
	args: {
		src: gazzoAvatar,
		description: 'user description',
		status: undefined,
		large: false,
	},
	argTypes: {
		status: {
			control: {
				type: 'select',
				options: [undefined, 'offline', 'away', 'busy', 'online'],
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof Avatar>>;

type Story = StoryObj<ComponentProps<typeof Avatar>>;

export const Default: Story = {
	name: 'default',
};

export const Large: Story = {
	name: 'large',
	args: {
		large: true,
	},
};

export const Small: Story = {
	name: 'small',
	args: {
		small: true,
	},
};

export const AsPlaceholder: Story = {
	name: 'as placeholder',
	args: {
		src: '',
	},
	render: (args) => (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
			<Avatar {...args} style={{ margin: '0.5rem' }} large />
			<Avatar {...args} style={{ margin: '0.5rem' }} />
			<Avatar {...args} style={{ margin: '0.5rem' }} small />
		</div>
	),
};

export const WithStatusIndicator: Story = {
	name: 'with status indicator',
	render: (args) => (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
			<Avatar {...args} style={{ margin: '0.5rem' }} status='offline' />
			<Avatar {...args} style={{ margin: '0.5rem' }} status='away' />
			<Avatar {...args} style={{ margin: '0.5rem' }} status='busy' />
			<Avatar {...args} style={{ margin: '0.5rem' }} status='online' />
		</div>
	),
};
