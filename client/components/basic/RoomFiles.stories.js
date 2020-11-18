import React from 'react';

import { RoomFiles } from './RoomFiles';
import VerticalBar from './VerticalBar';

export default {
	title: 'components/RoomFiles',
	component: RoomFiles,
};

const filesData = [
	{
		fileName: 'filexsauensauneua senas eka smdka e ase ase ase ase ase ms',
		imgUrl: 'https://open.rocket.chat/ufs/AmazonS3:Uploads/jJxug7hSKS5GiQZRv/Clipboard%20-%20October%2014,%202020%206:47%20PM',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
		isMine: true,
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/ufs/AmazonS3:Uploads/jJxug7hSKS5GiQZRv/Clipboard%20-%20October%2014,%202020%206:47%20PM',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/ufs/AmazonS3:Uploads/jJxug7hSKS5GiQZRv/Clipboard%20-%20October%2014,%202020%206:47%20PM',
		fileUrl: '#',
		uploadedAt: '17 de Novembro de 2020 às 19:13',
		userName: 'dougfabris',
	},
	{
		fileName: 'filex',
		imgUrl: 'https://open.rocket.chat/ufs/AmazonS3:Uploads/jJxug7hSKS5GiQZRv/Clipboard%20-%20October%2014,%202020%206:47%20PM',
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
		filesData={filesData}
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
		filesData={[]}
		options={options}
	/>
</VerticalBar>;
