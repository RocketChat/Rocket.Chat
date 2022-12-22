import type { ReactElement } from 'react';
import React from 'react';

import type { UrlPreviewMetadata } from './PreviewList';

const UrlAudioPreview = ({ url }: Pick<UrlPreviewMetadata, 'url'>): ReactElement => (
	<audio controls>
		<source src={url} />
		Your browser doesn't support the audio element.
	</audio>
);

export default UrlAudioPreview;
