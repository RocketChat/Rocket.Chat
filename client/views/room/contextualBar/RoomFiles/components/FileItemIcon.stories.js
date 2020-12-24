import React from 'react';

import FileItemIcon from './FileItemIcon';

export default {
	title: 'views/room/contextualBar/RoomFiles/FileItemIcon',
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

export const _FileItemIcon = () => <FileItemIcon type={options[0]} />;
_FileItemIcon.storyName = 'FileItemIcon';
