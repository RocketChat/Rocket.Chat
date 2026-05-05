import { Box, MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import type { UrlPreviewMetadata } from './UrlPreviewMetadata';
import { useOembedLayout } from '../../hooks/useOembedLayout';

const UrlImagePreview = ({ url }: Pick<UrlPreviewMetadata, 'url'>): ReactElement => {
	const { maxHeight: oembedMaxHeight } = useOembedLayout();

	return (
		<Box maxHeight={oembedMaxHeight} maxWidth='100%' overflow='hidden'>
			<MessageGenericPreviewImage
				data-id={url}
				className='preview-image'
				url={url || ''}
				alt=''
				style={{ maxHeight: oembedMaxHeight, width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
			/>
		</Box>
	);
};

export default UrlImagePreview;
