import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import RoomFiles from './RoomFiles';

export default {
	title: 'room/contextualBar/RoomFiles',
	component: RoomFiles,
};

const filesItems = [
	{
		name: 'Lorem Ipsum Indolor Dolor',
		url: '#',
		uploadedAt: 'May 02, 2020 01:00 PM',
		user: {
			username: 'loremIpsum',
		},
	},
	{
		name: 'Lorem Ipsum Indolor Dolor',
		url: '#',
		uploadedAt: 'May 02, 2020 01:00 PM',
		user: {
			username: 'loremIpsum',
		},
	},
];

const options = [
	['all', 'All'],
	['images', 'Images'],
	['videos', 'Videos'],
	['audios', 'Audios'],
	['texts', 'Texts'],
	['files', 'Files'],
];

export const Default = () => (
	<VerticalBar>
		<RoomFiles
			icon='lock'
			options={options}
			filesItems={filesItems}
			onClickHide={alert}
			onClickLeave={alert}
			onClickEdit={alert}
			onClickDelete={alert}
		/>
	</VerticalBar>
);

export const Loading = () => (
	<VerticalBar>
		<RoomFiles loading options={options} />
	</VerticalBar>
);

export const Empty = () => (
	<VerticalBar>
		<RoomFiles filesItems={[]} options={options} />
	</VerticalBar>
);
