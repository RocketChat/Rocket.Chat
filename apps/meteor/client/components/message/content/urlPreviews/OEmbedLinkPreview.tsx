import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

const OEmbedLinkPreview = ({ image, url, ...props }: OEmbedPreviewMetadata): ReactElement => (
	<OEmbedCollapsible url={url} {...props}>
		{image?.url && url && (
			<ExternalLink to={url}>
				<MessageGenericPreviewCoverImage height={192} width={368} url={image?.url} />
			</ExternalLink>
		)}
	</OEmbedCollapsible>
);

export default OEmbedLinkPreview;
