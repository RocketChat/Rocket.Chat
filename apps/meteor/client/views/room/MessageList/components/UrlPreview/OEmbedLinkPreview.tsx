import { MessageGenericPreviewImage } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { PreviewMetadata } from './PreviewList';

const OEmbedLinkPreview = ({ image, url, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapsible url={url} {...props}>
		{image?.url && <MessageGenericPreviewImage height={192} width={368} url={image?.url} externalUrl={url} />}
	</OEmbedCollapsible>
);

export default OEmbedLinkPreview;
