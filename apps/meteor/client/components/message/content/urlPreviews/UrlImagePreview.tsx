import { Box, MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';
import { useOembedLayout } from '../../hooks/useOembedLayout';

const UrlImagePreview = ({ url }: Pick<UrlPreviewMetadata, 'url'>): ReactElement => {
	const { maxHeight: oembedMaxHeight } = useOembedLayout();

	return (
		<Box maxHeight={oembedMaxHeight} maxWidth='100%'>
			<MessageGenericPreviewImage data-id={url} className='preview-image' url={url || ''} alt='' />
		</Box>
	);
};

export default UrlImagePreview;
