import { Box } from '@rocket.chat/fuselage';
import React, { useState } from 'react';

import FileUploadModal from '.';

export default {
	title: 'components/modals/FileUploadModal',
	component: FileUploadModal,
};

const onClose = () => console.log('close');

const _file = new File(['lol'], 'lol', { type: 'image' });

export const Default = () => {
	const [file, setFile] = useState(_file);

	const handleFile = (e) => {
		console.log(e.target.files);
		setFile(e.target.files[0]);
	};
	return (
		<Box>
			<Box is='input' type='file' onChange={handleFile} />
			<FileUploadModal file={file} onClose={onClose} />
		</Box>
	);
};
