import { useEffect, useState } from 'react';

import type { MessageComposerFileItemProps } from './MessageComposerFileItem';
import MessageComposerGenericFile from './MessageComposerGenericFile';
import { getRestoredUploadUrl } from '../../../../lib/chats/getRestoredUploadUrl';
import { useFileAsDataURL } from '../../hooks/useFileAsDataURL';

const useImageStatus = (url: string | undefined): 'loading' | 'loaded' | 'error' => {
	const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

	useEffect(() => {
		if (!url) {
			return;
		}

		setStatus('loading');
		let ignore = false;
		const image = new Image();
		image.onload = () => !ignore && setStatus('loaded');
		image.onerror = () => !ignore && setStatus('error');
		image.src = url;

		return () => {
			ignore = true;
		};
	}, [url]);

	return status;
};

const MessageComposerImageFile = ({ upload, ...props }: MessageComposerFileItemProps) => {
	const [dataURLRead, dataURL] = useFileAsDataURL(upload.file);
	const previewUrl = getRestoredUploadUrl(upload) ?? (typeof dataURL === 'string' ? dataURL : undefined);
	const status = useImageStatus(previewUrl);

	// A file that won't render as an image, such as one with a misleading extension, shows as a plain file instead.
	if (status === 'error' || (!previewUrl && dataURLRead)) {
		return <MessageComposerGenericFile upload={upload} {...props} />;
	}

	return <MessageComposerGenericFile upload={upload} shouldPreview previewUrl={status === 'loaded' ? previewUrl : undefined} {...props} />;
};

export default MessageComposerImageFile;
