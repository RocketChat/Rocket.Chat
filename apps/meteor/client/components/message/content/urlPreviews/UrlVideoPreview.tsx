import type { UrlPreviewMetadata } from './UrlPreviewMetadata';

export type UrlVideoPreviewProps = Omit<UrlPreviewMetadata, 'type'>;

const style = { maxWidth: '100%' };
const UrlVideoPreview = ({ url, originalType }: UrlVideoPreviewProps) => (
	<video controls style={style}>
		<source src={url} type={originalType} />
		Your browser doesn&apos;t support the video element.
		<track kind='captions' />
	</video>
);

export default UrlVideoPreview;
