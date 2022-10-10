import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { PreviewMetadata } from './PreviewList';

const OEmbedImagePreview = ({ image, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>
		{image?.url && <MessageGenericPreviewCoverImage height={192} width={368} url={image?.url} />}
	</OEmbedCollapsible>
);

export default OEmbedImagePreview;
