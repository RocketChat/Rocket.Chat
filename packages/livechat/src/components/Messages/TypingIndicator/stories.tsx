import type { ComponentMeta, ComponentStory } from '@storybook/react';

import { TypingIndicator } from '.';
import { avatarResolver } from '../../../helpers.stories';

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
} satisfies ComponentMeta<typeof TypingIndicator>;

const Template: ComponentStory<typeof TypingIndicator> = (args) => <TypingIndicator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'default';

export const WithAvatars = Template.bind({});
WithAvatars.storyName = 'with avatars';
WithAvatars.args = {
	usernames: ['guilherme.gazzo', 'tasso.evangelista', 'martin.schoeler'],
};
