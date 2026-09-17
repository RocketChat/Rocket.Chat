import type { StoryObj, Meta } from '@storybook/react';

import FileUploadModal from '.';

export default {
	component: FileUploadModal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		file: new File(['The lazy brown fox jumped over the lazy brown fox.'], 'test.txt', { type: 'text/plain' }),
		fileName: 'test.txt',
	},
} satisfies Meta<typeof FileUploadModal>;

export const Default: StoryObj<typeof FileUploadModal> = {
	name: 'FileUploadModal',
};
