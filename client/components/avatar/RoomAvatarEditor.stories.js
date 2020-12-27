import { action } from '@storybook/addon-actions';
import React from 'react';

import RoomAvatarEditor from './RoomAvatarEditor';

export default {
	title: 'components/avatar/RoomAvatarEditor',
	component: RoomAvatarEditor,
	argTypes: {
		room: { control: 'object' },
		roomAvatar: { control: 'object' },
		size: { control: 'text' },
		url: { control: 'text' },
	},
};

const Template = (args) => <RoomAvatarEditor {...args} onChangeAvatar={action('onChangeAvatar')} />;

export const _RoomAvatarEditor = Template.bind();
_RoomAvatarEditor.storyName = 'RoomAvatarEditor';
_RoomAvatarEditor.args = {
	room: {},
};
