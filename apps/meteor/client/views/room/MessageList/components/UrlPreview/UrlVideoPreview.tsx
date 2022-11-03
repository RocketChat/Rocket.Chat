import React, { ReactElement } from 'react';

import type { UrlPreview } from './PreviewList';

const style = { maxWidth: '100%' };
const UrlVideoPreview = ({ url, originalType }: Omit<UrlPreview, 'type'>): ReactElement => (
	<video controls style={style}>
		<source src={url} type={originalType} />
		Your browser doesn't support the video element.
	</video>
);

export default UrlVideoPreview;
