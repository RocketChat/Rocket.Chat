import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../../components/Contextualbar';
import FileItem from './FileItem';

export default {
	title: 'Room/Contextual Bar/RoomFiles/FileItem',
	component: FileItem,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
} as ComponentMeta<typeof FileItem>;

export const Default: ComponentStory<typeof FileItem> = (args) => <FileItem {...args} />;
Default.storyName = 'FileItem';
Default.args = {
	fileData: {
		_id: '1',
		name: 'Lorem Ipsum Indolor Dolor',
		url: '#',
		uploadedAt: new Date(),
		user: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
		},
	},
};
