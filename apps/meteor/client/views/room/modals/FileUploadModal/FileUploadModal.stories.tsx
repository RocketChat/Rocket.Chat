import type { Meta, StoryFn } from '@storybook/react';

import FileUploadModal from '.';

export default {
	title: 'Room/Modals/FileUploadModal',
	component: FileUploadModal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		file: new File(['The lazy brown fox jumped over the lazy brown fox.'], 'test.txt', { type: 'text/plain' }),
		fileName: 'test.txt',
		fileDescription: '',
		invalidContentType: false,
	},
} satisfies Meta<typeof FileUploadModal>;

export const Default: StoryFn<typeof FileUploadModal> = (args) => <FileUploadModal {...args} />;
Default.storyName = 'FileUploadModal';
