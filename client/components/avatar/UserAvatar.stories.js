import React from 'react';

import UserAvatar from './UserAvatar';

export default {
	title: 'components/avatar/UserAvatar',
	component: UserAvatar,
	argTypes: {
		etag: { control: 'text' },
		size: { control: 'text' },
		url: { control: 'text' },
		username: { control: 'text' },
	},
};

const Template = (args) => <UserAvatar {...args} />;

export const _UserAvatar = Template.bind();
_UserAvatar.storyName = 'UserAvatar';
_UserAvatar.args = {
	size: 'x48',
};
