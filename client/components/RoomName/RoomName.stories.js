import { Icon } from '@rocket.chat/fuselage';
import React from 'react';

import RoomName from '.';

export default {
	title: 'components/RoomName',
	component: RoomName,
	subcomponents: {
		'RoomName.Skeleton': RoomName.Skeleton,
	},
	argTypes: {
		icon: { control: null },
	},
};

export const _RoomName = (args) => <RoomName {...args} />;
_RoomName.storyName = 'RoomName';
_RoomName.args = {
	icon: <Icon name='hashtag' size={22} />,
	name: 'general',
};

export const Skeleton = (args) => <RoomName.Skeleton {...args} />;
