import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import RoomInfo from './RoomInfo';

export default {
	title: 'Room/Contextual Bar/RoomInfo',
	component: RoomInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on[A-Z].*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
	args: {
		icon: 'lock',
	},
} as ComponentMeta<typeof RoomInfo>;

const Template: ComponentStory<typeof RoomInfo> = (args) => <RoomInfo {...args} />;

export const Default = Template.bind({});
Default.args = {
	room: {
		fname: 'rocketchat-frontend-team',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
		announcement:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
		topic:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	},
};

export const Archived = Template.bind({});
Archived.args = {
	...Default.args,
	room: {
		...Default.args.room,
		archived: true,
	},
};

export const Broadcast = Template.bind({});
Broadcast.args = {
	...Default.args,
	room: {
		...Default.args.room,
		broadcast: true,
	},
};
