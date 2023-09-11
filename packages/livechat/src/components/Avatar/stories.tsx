import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { Avatar } from '.';
import { gazzoAvatar } from '../../../.storybook/helpers';

export default {
	title: 'Components/Avatar',
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

const Template: Story<ComponentProps<typeof Avatar>> = (args) => <Avatar {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const Large = Template.bind({});
Large.storyName = 'large';
Large.args = {
	large: true,
};

export const Small = Template.bind({});
Small.storyName = 'small';
Small.args = {
	small: true,
};

export const AsPlaceholder: Story<ComponentProps<typeof Avatar>> = (args) => (
	<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
		<Avatar {...args} style={{ margin: '0.5rem' }} large />
		<Avatar {...args} style={{ margin: '0.5rem' }} />
		<Avatar {...args} style={{ margin: '0.5rem' }} small />
	</div>
);
AsPlaceholder.storyName = 'as placeholder';
AsPlaceholder.args = {
	src: '',
};

export const WithStatusIndicator: Story<ComponentProps<typeof Avatar>> = (args) => (
	<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
		<Avatar {...args} style={{ margin: '0.5rem' }} status='offline' />
		<Avatar {...args} style={{ margin: '0.5rem' }} status='away' />
		<Avatar {...args} style={{ margin: '0.5rem' }} status='busy' />
		<Avatar {...args} style={{ margin: '0.5rem' }} status='online' />
	</div>
);
WithStatusIndicator.storyName = 'with status indicator';
