import type { Meta, StoryFn } from '@storybook/react';

import FileItemIcon from './FileItemIcon';

export default {
	title: 'Room/Contextual Bar/RoomFiles/FileItemIcon',
	component: FileItemIcon,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof FileItemIcon>;

const Template: StoryFn<typeof FileItemIcon> = (args) => <FileItemIcon {...args} />;

export const Unknown = Template.bind({});

export const Spreadsheet = Template.bind({});
Spreadsheet.args = { type: 'application/vnd.ms-excel' };

export const Audio = Template.bind({});
Audio.args = { type: 'audio' };

export const Video = Template.bind({});
Video.args = { type: 'video' };

export const Document = Template.bind({});
Document.args = { type: 'application/msword' };

export const Compressed = Template.bind({});
Compressed.args = { type: 'application/x-zip-compressed' };

export const PDF = Template.bind({});
PDF.args = { type: 'application/pdf' };
