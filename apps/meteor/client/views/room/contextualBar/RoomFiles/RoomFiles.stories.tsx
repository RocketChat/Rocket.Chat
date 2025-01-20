import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import RoomFiles from './RoomFiles';
import { Contextualbar } from '../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/RoomFiles',
	component: RoomFiles,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof RoomFiles>;

const Template: StoryFn<typeof RoomFiles> = (args) => <RoomFiles {...args} />;

export const Default = Template.bind({});
Default.args = {
	filesItems: [
		{
			_id: '1',
			name: 'Lorem Ipsum Indolor Dolor',
			url: '#',
			uploadedAt: new Date(),
			user: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
		},
		{
			_id: '2',
			name: 'Lorem Ipsum Indolor Dolor',
			url: '#',
			uploadedAt: new Date(),
			user: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
		},
	],
	text: 'Ipsum',
	type: 'text',
	setText: action('setText'),
	setType: action('setType'),
	total: 2,
	loadMoreItems: action('loadMoreItems'),
};

export const Loading = Template.bind({});
Loading.args = {
	loading: true,
};

export const Empty = Template.bind({});
Empty.args = {
	setText: action('setText'),
	setType: action('setType'),
	loadMoreItems: action('loadMoreItems'),
};
