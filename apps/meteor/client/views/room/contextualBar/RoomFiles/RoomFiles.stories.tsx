import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import RoomFiles from './RoomFiles';

export default {
	title: 'Room/Contextual Bar/RoomFiles',
	component: RoomFiles,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof RoomFiles>;

const Template: ComponentStory<typeof RoomFiles> = (args) => <RoomFiles {...args} />;

export const Default = Template.bind({});
Default.args = {
	filesItems: [
		{
			name: 'Lorem Ipsum Indolor Dolor',
			url: '#',
			uploadedAt: new Date(),
			user: {
				username: 'rocket.cat',
			},
		},
		{
			name: 'Lorem Ipsum Indolor Dolor',
			url: '#',
			uploadedAt: new Date(),
			user: {
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
	isDeletionAllowed: (...args: unknown[]) => {
		action('isDeletionAllowed')(...args);
		return true;
	},
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
	isDeletionAllowed: (...args: unknown[]) => {
		action('isDeletionAllowed')(...args);
		return true;
	},
};
