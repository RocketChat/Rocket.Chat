import { Contextualbar } from '@rocket.chat/ui-client';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import RoomFiles from './RoomFiles';

export default {
	component: RoomFiles,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
	args: {
		type: 'all',
		text: '',
		loadMoreItems: action('loadMoreItems'),
		setText: action('setText'),
		setType: action('setType'),
	},
} satisfies Meta<typeof RoomFiles>;

const Template: StoryFn<typeof RoomFiles> = (args) => <RoomFiles {...args} />;

const fakeItems = Array.from({ length: 10 }, (_, i) => ({
	_id: String(i),
	name: `File ${i}`,
	url: '#',
	uploadedAt: new Date(),
	user: {
		_id: 'rocket.cat',
		username: 'rocket.cat',
	},
	_updatedAt: new Date(),
}));

export const Default = Template.bind({});
Default.args = {
	filesItems: fakeItems,
	total: fakeItems.length,
	isSuccess: true,
};

export const Loading = Template.bind({});
Loading.args = {
	isPending: true,
};

export const Empty = Template.bind({});
Empty.args = {
	isSuccess: true,
	filesItems: [],
	total: 0,
};
