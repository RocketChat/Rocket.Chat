import type { RoomType } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import RoomInfo from './RoomInfo';
import FakeRoomProvider from '../../../../../../tests/mocks/client/FakeRoomProvider';

export default {
	component: RoomInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on[A-Z].*' },
	},
	decorators: [
		(fn) => (
			<FakeRoomProvider roomOverrides={roomArgs}>
				<Contextualbar height='100vh'>{fn()}</Contextualbar>
			</FakeRoomProvider>
		),
	],
	args: {
		icon: 'lock',
	},
} satisfies Meta<typeof RoomInfo>;

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

const Template: StoryFn<typeof RoomInfo> = (args) => <RoomInfo {...args} />;

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

export const ABAC = Template.bind({});
ABAC.decorators = [
	mockAppRoot().withSetting('ABAC_Enabled', true).withSetting('ABAC_ShowAttributesInRooms', true).buildStoryDecorator(),
	(fn) => (
		<FakeRoomProvider roomOverrides={roomArgs}>
			<Contextualbar height='100vh'>{fn()}</Contextualbar>
		</FakeRoomProvider>
	),
];
ABAC.args = {
	...Default.args,
	room: {
		...roomArgs,
		abacAttributes: [
			{ key: 'Chat-sensitivity', values: ['Classified', 'Top-Secret'] },
			{ key: 'Country', values: ['US-only'] },
			{ key: 'Project', values: ['Ruminator-2000'] },
		],
	},
};
