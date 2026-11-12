import { Box, MessageGenericPreviewImage } from '@rocket.chat/fuselage';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';
import { useOembedLayout } from '../../hooks/useOembedLayout';

export type UrlImagePreviewProps = Pick<UrlPreviewMetadata, 'url'>;

const UrlImagePreview = ({ url }: UrlImagePreviewProps) => {
	const { maxHeight: oembedMaxHeight } = useOembedLayout();

	return (
		<Box maxHeight={oembedMaxHeight} maxWidth='100%'>
			<MessageGenericPreviewImage data-id={url} className='preview-image' url={url || ''} alt='' />
		</Box>
	);
};

export default UrlImagePreview;
