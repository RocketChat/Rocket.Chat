import { MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedCollapseable from './OEmbedCollapseable';
import type { PreviewMetadata } from './PreviewList';

const OEmbedImagePreview = ({ image, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapseable {...props}>
		<MessageGenericPreviewImage height={192} width={368} url={image?.url || ''} />
	</OEmbedCollapseable>
);

export default OEmbedImagePreview;
