import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import MediaPreview from './MediaPreview';

export enum FilePreviewType {
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
}

const getFileType = (fileType: File['type']): FilePreviewType | undefined => {
	for (const type of Object.values(FilePreviewType)) {
		if (fileType.indexOf(type) > -1) {
			return type;
		}
	}
};

type FilePreviewProps = {
	file: File;
};

const FilePreview = ({ file }: FilePreviewProps): ReactElement => {
	const fileType = getFileType(file.type);
	console.log('fileType', fileType);
	if (fileType && Object.values(FilePreviewType).includes(fileType)) {
		return <MediaPreview file={file} fileType={fileType} />;
	}

	// TODO display file size
	return <Box>{file.name}</Box>;
};

export default FilePreview;
