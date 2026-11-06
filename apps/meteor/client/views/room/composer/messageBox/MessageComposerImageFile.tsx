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
	const [, dataURL] = useFileAsDataURL(upload.file);
	const restoredUrl = getRestoredUploadUrl(upload);
	const restoredStatus = useImageStatus(restoredUrl);

	if (restoredUrl && restoredStatus === 'error') {
		return <MessageComposerGenericFile upload={upload} {...props} />;
	}

	const loadedRestoredUrl = restoredStatus === 'loaded' ? restoredUrl : undefined;
	const previewUrl = restoredUrl ? loadedRestoredUrl : dataURL;

	return (
		<MessageComposerGenericFile
			upload={upload}
			shouldPreview
			previewUrl={typeof previewUrl === 'string' ? previewUrl : undefined}
			{...props}
		/>
	);
};

export default MessageComposerImageFile;
