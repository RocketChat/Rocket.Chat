import React, { ReactElement } from 'react';

import type { UrlPreview } from './PreviewList';
import UrlAudioPreview from './UrlAudioPreview';
import UrlImagePreview from './UrlImagePreview';
import UrlVideoPreview from './UrlVideoPreview';

const UrlPreviewResolver = ({ url, type, originalType }: UrlPreview): ReactElement | null => {
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
