import React from 'react';
import { select } from '@storybook/addon-knobs';

import FileItemIcon from './FileItemIcon';

export default {
	title: 'components/RoomFiles/FileItemIcon',
	component: FileItemIcon,
};

const label = 'Type';
const defaultValue = '';
const options = [
	'',
	'application/vnd.ms-excel',
	'audio',
	'video',
	'application/msword',
	'application/x-zip-compressed',
	'application/pdf',
];

export const Default = () => <FileItemIcon type={select(label, options, defaultValue)} />;
