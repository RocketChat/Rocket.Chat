import type { RoomType } from '@rocket.chat/core-typings';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../../components/Contextualbar';
import RoomInfo from './RoomInfo';

export default {
	title: 'Room/Contextual Bar/RoomInfo',
	component: RoomInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on[A-Z].*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		icon: 'lock',
	},
} as ComponentMeta<typeof RoomInfo>;

const roomArgs = {
	_id: 'myRoom',
	t: 'c' as RoomType,
	msgs: 5,
	usersCount: 1,
	u: {
		_id: 'rocketchat.internal.admin.test',
		username: 'rocketchat.internal.admin.test',
	},
	ts: new Date(),
	autoTranslateLanguage: 'en',
	_updatedAt: new Date(),
	fname: 'rocketchat-frontend-team',
	description:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	announcement:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	topic:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
};

const Template: ComponentStory<typeof RoomInfo> = (args) => <RoomInfo {...args} />;

export const Default = Template.bind({});
Default.args = {
	room: roomArgs,
};

export const Archived = Template.bind({});
Archived.args = {
	...Default.args,
	room: {
		...roomArgs,
		archived: true,
	},
};

export const Broadcast = Template.bind({});
Broadcast.args = {
	...Default.args,
	room: {
		...roomArgs,
		broadcast: true,
	},
};
