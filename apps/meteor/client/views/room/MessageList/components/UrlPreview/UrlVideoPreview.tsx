import type { ReactElement } from 'react';
import React from 'react';

import type { UrlPreviewMetadata } from './PreviewList';

const style = { maxWidth: '100%' };
const UrlVideoPreview = ({ url, originalType }: Omit<UrlPreviewMetadata, 'type'>): ReactElement => (
	<video controls style={style}>
		<source src={url} type={originalType} />
		Your browser doesn't support the video element.
	</video>
);

export default UrlVideoPreview;
