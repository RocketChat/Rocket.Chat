import { Box, Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useEffect, useState, memo } from 'react';

import { userAgentMIMETypeFallback } from '../../../../lib/utils/userAgentMIMETypeFallback';
import { FilePreviewType } from './FilePreview';
import ImagePreview from './ImagePreview';
import PreviewSkeleton from './PreviewSkeleton';

type ReaderOnloadCallback = (url: FileReader['result']) => void;

const readFileAsDataURL = (file: File, callback: ReaderOnloadCallback): void => {
	const reader = new FileReader();
	reader.onload = (e): void => callback(e?.target?.result || null);

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

const MediaPreview = ({ file, fileType }: MediaPreviewProps): ReactElement => {
	const [loaded, url] = useFileAsDataURL(file);
	const t = useTranslation();

	if (!loaded) {
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
				<source src={url} type={userAgentMIMETypeFallback(file.type)} />
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
