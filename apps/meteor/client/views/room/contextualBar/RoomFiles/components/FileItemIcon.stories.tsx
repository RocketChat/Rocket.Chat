import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import FileItemIcon from './FileItemIcon';

export default {
	title: 'Room/Contextual Bar/RoomFiles/FileItemIcon',
	component: FileItemIcon,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof FileItemIcon>;

const Template: ComponentStory<typeof FileItemIcon> = (args) => <FileItemIcon {...args} />;

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
