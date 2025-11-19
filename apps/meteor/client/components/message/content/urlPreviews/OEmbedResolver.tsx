import type { ReactElement } from 'react';

import OEmbedHtmlPreview from './OEmbedHtmlPreview';
import OEmbedImagePreview from './OEmbedImagePreview';
import OEmbedLinkPreview from './OEmbedLinkPreview';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

type OEmbedResolverProps = {
	meta: OEmbedPreviewMetadata;
};

const OEmbedResolver = ({ meta }: OEmbedResolverProps): ReactElement | null => {

   // We force it to render as a standard Link Preview (Image + Text) instead.
	const isTwitter =
	   meta.providerName?.toLowerCase() === 'twitter' ||
	   meta.providerName === 'X' ||
	   meta.providerUrl?.includes('twitter.com') ||
	   meta.providerUrl?.includes('x.com');

    if (isTwitter) {
	   return <OEmbedLinkPreview {...meta} />;
    }

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
