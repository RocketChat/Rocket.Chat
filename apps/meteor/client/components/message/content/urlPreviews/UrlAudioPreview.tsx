import { AudioPlayer } from '@rocket.chat/fuselage';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';

type UrlAudioPreviewProps = Pick<UrlPreviewMetadata, 'url'>;

const UrlAudioPreview = ({ url }: UrlAudioPreviewProps) => <AudioPlayer src={url} />;

export default UrlAudioPreview;
