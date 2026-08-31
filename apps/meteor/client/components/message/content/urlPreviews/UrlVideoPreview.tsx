import type { UrlPreviewMetadata } from './UrlPreviewMetadata';

const style = { maxWidth: '100%' };
const UrlVideoPreview = ({ url, originalType }: Omit<UrlPreviewMetadata, 'type'>) => (
	<video controls style={style}>
		<source src={url} type={originalType} />
		Your browser doesn&apos;t support the video element.
		<track kind='captions' />
	</video>
);

export default UrlVideoPreview;
