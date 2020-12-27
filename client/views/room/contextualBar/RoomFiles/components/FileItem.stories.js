import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { FileItem } from './FileItem';

export default {
	title: 'views/room/contextualBar/RoomFiles/FileItem',
	component: FileItem,
};

const fileData = {
	name: 'Lorem Ipsum Indolor Dolor',
	url: '#',
	uploadedAt: 'May 02, 2020 01:00 PM',
	user: {
		username: 'loremIpsum',
	},
};

export const _FileItem = () => <VerticalBar>
	<FileItem
		fileData={fileData}
	/>
</VerticalBar>;
_FileItem.storyName = 'FileItem';
