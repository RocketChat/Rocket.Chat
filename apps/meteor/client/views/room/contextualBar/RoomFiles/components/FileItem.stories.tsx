import { Box } from '@rocket.chat/fuselage';
import { Contextualbar } from '@rocket.chat/ui-client';
import type { StoryObj, Meta } from '@storybook/react';

import FileItem from './FileItem';

export default {
	component: FileItem,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(fn) => (
			<Box height='100vh'>
				<Contextualbar>{fn()}</Contextualbar>
			</Box>
		),
	],
} satisfies Meta<typeof FileItem>;

export const Default: StoryObj<typeof FileItem> = {
	name: 'FileItem',

	args: {
		fileData: {
			_id: '1',
			name: 'Lorem Ipsum Indolor Dolor',
			url: '#',
			uploadedAt: new Date(),
			user: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			_updatedAt: new Date(),
		},
	},
};
