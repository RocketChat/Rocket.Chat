import type { Meta, Story } from '@storybook/preact';
import type { ComponentProps } from 'preact';

import { MessageAvatars } from '.';
import { avatarResolver } from '../../../helpers.stories';

export default {
	title: 'Messages/MessageAvatars',
	component: MessageAvatars,
	args: {
		avatarResolver,
		usernames: [],
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<ComponentProps<typeof MessageAvatars>>;

const Template: Story<ComponentProps<typeof MessageAvatars>> = (args) => <MessageAvatars {...args} />;

export const Empty = Template.bind({});
Empty.storyName = 'empty';

export const WithOneAvatar = Template.bind({});
WithOneAvatar.storyName = 'with one avatar';
WithOneAvatar.args = {
	usernames: ['guilherme.gazzo'],
};

export const WithTwoAvatars = Template.bind({});
WithTwoAvatars.storyName = 'with two avatars';
WithTwoAvatars.args = {
	usernames: ['guilherme.gazzo', 'tasso.evangelista'],
};

export const WithThreeAvatars = Template.bind({});
WithThreeAvatars.storyName = 'with three avatars';
WithThreeAvatars.args = {
	usernames: ['guilherme.gazzo', 'tasso.evangelista', 'martin.schoeler'],
};

export const WithNameAsAvatarInsteadOfUsernameForGuests = Template.bind({});
WithNameAsAvatarInsteadOfUsernameForGuests.storyName = 'with name as avatar instead of username for guests';
WithNameAsAvatarInsteadOfUsernameForGuests.args = {
	usernames: ['livechat guest'],
};
