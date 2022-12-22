import type { ReactElement } from 'react';
import React from 'react';

import OEmbedHtmlPreview from './OEmbedHtmlPreview';
import OEmbedImagePreview from './OEmbedImagePreview';
import OEmbedLinkPreview from './OEmbedLinkPreview';
import type { PreviewMetadata } from './PreviewList';

type OEmbedResolverProps = {
	meta: PreviewMetadata;
};

const OEmbedResolver = ({ meta }: OEmbedResolverProps): ReactElement | null => {
	switch (meta.type) {
		case 'rich':
		case 'video':
			return <OEmbedHtmlPreview {...meta} />;

		case 'photo':
			return <OEmbedImagePreview {...meta} />;

		default:
			return <OEmbedLinkPreview {...meta} />;
	}
};

export default OEmbedResolver;
