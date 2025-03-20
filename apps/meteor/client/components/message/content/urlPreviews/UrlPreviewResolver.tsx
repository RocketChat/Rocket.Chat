import type { ReactElement } from 'react';

import UrlAudioPreview from './UrlAudioPreview';
import UrlImagePreview from './UrlImagePreview';
import type { UrlPreviewMetadata } from './UrlPreviewMetadata';
import UrlVideoPreview from './UrlVideoPreview';

const UrlPreviewResolver = ({ url, type, originalType }: UrlPreviewMetadata): ReactElement | null => {
	switch (type) {
		case 'audio':
			return <UrlAudioPreview url={url} />;
		case 'video':
			return <UrlVideoPreview url={url} originalType={originalType} />;
		case 'image':
			return <UrlImagePreview url={url} />;
		default:
			return null;
	}
};

export default UrlPreviewResolver;
