import type { ReactElement } from 'react';
import React from 'react';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';

type UrlAudioPreviewProps = Pick<UrlPreviewMetadata, 'url'>;

const UrlAudioPreview = ({ url }: UrlAudioPreviewProps): ReactElement => (
	<audio controls>
		<source src={url} />
		Your browser doesn't support the audio element.
	</audio>
);

export default UrlAudioPreview;
