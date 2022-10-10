import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import React, { ReactElement } from 'react';

import { isURL } from '../../../../../../lib/utils/isURL';
import OEmbedCollapsible from './OEmbedCollapsible';
import type { PreviewMetadata } from './PreviewList';

const OEmbedLinkPreview = ({ image, url, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapsible url={url} {...props}>
		{image?.url && url && (
			<ExternalLink to={url}>
				{isURL(image?.url) && <MessageGenericPreviewCoverImage height={192} width={368} url={JSON.stringify(image?.url)} />}
			</ExternalLink>
		)}
	</OEmbedCollapsible>
);

export default OEmbedLinkPreview;
