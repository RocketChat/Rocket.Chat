import React from 'react';

import RoomAvatar from './RoomAvatar';

export default {
	title: 'components/avatar/RoomAvatar',
	component: RoomAvatar,
	argTypes: {
		room: { control: 'text' },
		size: { control: 'text' },
		url: { control: 'text' },
	},
};

const Template = (args) => <RoomAvatar {...args} />;

export const _RoomAvatar = Template.bind();
_RoomAvatar.storyName = 'RoomAvatar';
_RoomAvatar.args = {
	size: 'x48',
};
