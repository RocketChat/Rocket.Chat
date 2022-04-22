import React, { ReactElement } from 'react';

import type { UrlPreview } from './PreviewList';

const UrlAudioPreview = ({ url }: Pick<UrlPreview, 'url'>): ReactElement => (
	<audio controls>
		<source src={url} />
		Your browser doesn't support the audio element.
	</audio>
);

export default UrlAudioPreview;
