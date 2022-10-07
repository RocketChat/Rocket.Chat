import { Box, MessageGenericPreviewImageLink } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useMessageOembedMaxHeight, useMessageOembedMaxWidth } from '../../../contexts/MessageContext';
import type { UrlPreview } from './PreviewList';

const UrlImagePreview = ({ url }: Pick<UrlPreview, 'url'>): ReactElement => {
	const oembedMaxWidth = useMessageOembedMaxWidth();
	const oembedMaxHeight = useMessageOembedMaxHeight();

	return (
		<Box maxHeight={oembedMaxHeight} maxWidth={oembedMaxWidth}>
			<MessageGenericPreviewImageLink className='gallery-item' url={url || ''} />
		</Box>
	);
};

export default UrlImagePreview;
