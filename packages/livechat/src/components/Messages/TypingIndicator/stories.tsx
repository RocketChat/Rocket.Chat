import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { TypingIndicator } from '.';
import { avatarResolver } from '../../../../.storybook/helpers';

export default {
	title: 'Messages/TypingIndicator',
	component: TypingIndicator,
	args: {
		avatarResolver,
		usernames: [],
		text: 'The attendant is typing',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof TypingIndicator>>;

const Template: Story<ComponentProps<typeof TypingIndicator>> = (args) => <TypingIndicator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const WithAvatars = Template.bind({});
WithAvatars.storyName = 'with avatars';
WithAvatars.args = {
	usernames: ['guilherme.gazzo', 'tasso.evangelista', 'martin.schoeler'],
};
