import type { Meta, StoryFn } from '@storybook/react';

import FileItem from './FileItem';
import { Contextualbar } from '../../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/RoomFiles/FileItem',
	component: FileItem,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof FileItem>;

export const Default: StoryFn<typeof FileItem> = (args) => <FileItem {...args} />;
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
