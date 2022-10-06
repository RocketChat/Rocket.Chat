import { MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { PreviewMetadata } from './PreviewList';

const OEmbedImagePreview = ({ image, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>
		<MessageGenericPreviewImage height={192} width={368} url='https://i.pinimg.com/736x/73/57/1d/73571d32a797899a06811ecb442c0ecc.jpg' />
	</OEmbedCollapsible>
);

export default OEmbedImagePreview;
