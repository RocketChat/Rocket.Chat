import React from 'react';

import { RoomFiles } from './RoomFiles';
import VerticalBar from '../basic/VerticalBar';

export default {
	title: 'components/RoomFiles',
	component: RoomFiles,
};

const filesItems = [
	{
		fileName: 'filexsauensauneua senas eka smdka e ase ase ase ase ase ms',
		imgUrl: 'https://open.rocket.chat/file-upload/J8oxik4NHLJ288E5G/1424480348915.gif',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
		isMine: true,
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/file-upload/J8oxik4NHLJ288E5G/1424480348915.gif',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/file-upload/J8oxik4NHLJ288E5G/1424480348915.gif',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/file-upload/J8oxik4NHLJ288E5G/1424480348915.gif',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
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

export const Default = () => <VerticalBar>
	<RoomFiles
		icon='lock'
		options={options}
		filesItems={filesItems}
		onClickHide={alert}
		onClickLeave={alert}
		onClickEdit={alert}
		onClickDelete={alert}
	/>
</VerticalBar>;

export const Loading = () => <VerticalBar>
	<RoomFiles
		loading
		options={options}
	/>
</VerticalBar>;

export const Empty = () => <VerticalBar>
	<RoomFiles
		filesItems={[]}
		options={options}
	/>
</VerticalBar>;
