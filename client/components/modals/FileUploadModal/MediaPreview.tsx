import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement, useEffect, useState, memo } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { FilePreviewType } from './FilePreview';
import ImagePreview from './ImagePreview';
import PreviewSkeleton from './PreviewSkeleton';

type ReaderOnloadCallback = (url: FileReader['result']) => void;

const readFileAsDataURL = (file: File, callback: ReaderOnloadCallback): void => {
	const reader = new FileReader();
	console.log({
		file,
		reader,
		callback,
	});
	reader.onload = (e): void => {
		console.log(e);
		return callback(e?.target?.result || null);
	};

	return reader.readAsDataURL(file);
};

const useFileAsDataURL = (file: File): [loaded: boolean, url: null | FileReader['result']] => {
	const [loaded, setLoaded] = useState(false);
	console.log('loaded', loaded);
	const [url, setUrl] = useState<FileReader['result']>(null);
	console.log('url', url);

	useEffect(() => {
		setLoaded(false);
		console.log('set false');
		readFileAsDataURL(file, (url) => {
			console.log('inside callback');
			setUrl(url);
			console.log(url);
			setLoaded(true);
			console.log('setLoaded');
		});
	}, [file]);
	return [loaded, url];
};

type MediaPreviewProps = {
	file: File;
	fileType: FilePreviewType;
};

const MediaPreview = ({ file, fileType }: MediaPreviewProps): ReactElement => {
	const [loaded, url] = useFileAsDataURL(file);
	console.log('MediaPreview', { loaded, url, file, fileType });
	const t = useTranslation();

	if (!loaded) {
		console.log('in here');
		return <PreviewSkeleton />;
	}

	if (typeof url !== 'string') {
		return (
			<Box display='flex' alignItems='center' w='full'>
				<Icon name='image' size='x24' mie='x4' />
				{t('FileUpload_Cannot_preview_file')}
			</Box>
		);
	}

	if (fileType === FilePreviewType.IMAGE) {
		return <ImagePreview url={url} file={file} />;
	}

	if (fileType === FilePreviewType.VIDEO) {
		return (
			<Box is='video' w='full' controls>
				<source src={url} type={file.type} />
				{t('Browser_does_not_support_video_element')}
			</Box>
		);
	}

	if (fileType === FilePreviewType.AUDIO) {
		return (
			<Box is='audio' w='full' controls>
				<source src={url} type={file.type} />
				{t('Browser_does_not_support_audio_element')}
			</Box>
		);
	}

	throw new Error('Wrong props provided for MediaPreview');
};

export default memo(MediaPreview);
