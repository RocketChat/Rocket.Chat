import React, { ReactElement } from 'react';

import type { UrlPreview } from './PreviewList';

const UrlVideoPreview = ({ url, originalType }: Omit<UrlPreview, 'type'>): ReactElement => (
	<video controls>
		<source src={url} type={originalType} />
		Your browser doesn't support the video element.
	</video>
);

export default UrlVideoPreview;
