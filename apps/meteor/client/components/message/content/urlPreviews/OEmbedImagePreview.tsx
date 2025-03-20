import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

const OEmbedImagePreview = ({ image, ...props }: OEmbedPreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>
		{image?.url && <MessageGenericPreviewCoverImage height={192} width={368} url={image?.url} />}
	</OEmbedCollapsible>
);

export default OEmbedImagePreview;
