import React from 'react';

import FileItemIcon from './FileItemIcon';

export default {
	title: 'components/RoomFiles/FileItemIcon',
	component: FileItemIcon,
};

const options = [
	'',
	'application/vnd.ms-excel',
	'audio',
	'video',
	'application/msword',
	'application/x-zip-compressed',
	'application/pdf',
];

export const Default = () => <FileItemIcon type={options[0]} />;
