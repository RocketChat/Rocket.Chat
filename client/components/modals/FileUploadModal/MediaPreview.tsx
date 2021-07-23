import { Box, Skeleton, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useState, memo } from 'react';

import { FilePreviewType } from './FilePreview';

type ReaderOnloadCallback = (url: FileReader['result'], file: File) => void;

const readFileAsDataURL = (file: File, callback: ReaderOnloadCallback): void => {
	const reader = new FileReader();
	reader.onload = (e): void => callback(e?.target?.result || null, file);

	return reader.readAsDataURL(file);
};

const useFileAsDataURL = (file: File): [loaded: boolean, url: null | FileReader['result']] => {
	const [loaded, setLoaded] = useState(false);
	const [url, setUrl] = useState<FileReader['result']>(null);

	useEffect(() => {
		setLoaded(false);
		readFileAsDataURL(file, (url) => {
			setUrl(url);
			setLoaded(true);
		});
	}, [file]);
	return [loaded, url];
};

type MediaPreviewProps = {
	file: File;
	fileType: FilePreviewType;
};

// TODO
// TODO
// TODO
// TODO
// TODO
// Translations
// img onload onerror
const MediaPreview = ({ file, fileType }: MediaPreviewProps): ReactElement => {
	const [loaded, url] = useFileAsDataURL(file);

	if (!loaded) {
		return <Skeleton variant='rect' w='full' h='x200' />;
	}

	if (typeof url !== 'string') {
		return (
			<Box display='flex' alignItems='center' w='full'>
				<Icon name='image' size='x24' mie='x4' />
				Cannot preview file
			</Box>
		);
	}

	if (fileType === FilePreviewType.IMAGE) {
		return <img src={url} />;
	}

	if (fileType === FilePreviewType.VIDEO) {
		return (
			<Box is='video' w='full' controls>
				<source src={url} type={file.type} />
				Your browser does not support the video element.
			</Box>
		);
	}

	if (fileType === FilePreviewType.AUDIO) {
		return (
			<Box is='audio' w='full' controls>
				<source src={url} type={file.type} />
				Your browser does not support the audio element.
			</Box>
		);
	}

	throw new Error('Wrong props provided for MediaPreview');
};

export default memo(MediaPreview);
