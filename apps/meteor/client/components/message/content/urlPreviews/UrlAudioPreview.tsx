import { AudioPlayer } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';

type UrlAudioPreviewProps = Pick<UrlPreviewMetadata, 'url'>;

const UrlAudioPreview = ({ url }: UrlAudioPreviewProps): ReactElement => <AudioPlayer src={url} />;

export default UrlAudioPreview;
