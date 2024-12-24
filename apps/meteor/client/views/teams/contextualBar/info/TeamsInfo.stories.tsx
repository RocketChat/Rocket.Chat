import type { IRoom } from '@rocket.chat/core-typings';
import type { Meta, StoryFn } from '@storybook/react';

import TeamsInfo from './TeamsInfo';
import { Contextualbar } from '../../../../components/Contextualbar';

const room = {
	_id: 'awdawd',
	fname: 'rocketchat-frontend-team',
	description:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	announcement:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
	topic:
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
} as IRoom;

export default {
	title: 'Teams/Contextual Bar/TeamsInfo',
	component: TeamsInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		room,
	},
} satisfies Meta<typeof TeamsInfo>;

const Template: StoryFn<typeof TeamsInfo> = (args) => <TeamsInfo {...args} />;

export const Default = Template.bind({});

export const Archived = Template.bind({});
Archived.args = {
	room: { ...room, archived: true },
};

export const Broadcast = Template.bind({});
Broadcast.args = {
	room: { ...room, broadcast: true },
};
