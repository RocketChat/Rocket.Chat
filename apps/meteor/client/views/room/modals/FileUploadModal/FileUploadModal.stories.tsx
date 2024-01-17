import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

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
} as ComponentMeta<typeof FileUploadModal>;

export const Default: ComponentStory<typeof FileUploadModal> = (args) => <FileUploadModal {...args} />;
Default.storyName = 'FileUploadModal';
