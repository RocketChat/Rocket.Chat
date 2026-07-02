import OEmbedHtmlPreview from './OEmbedHtmlPreview';
import OEmbedImagePreview from './OEmbedImagePreview';
import OEmbedLinkPreview from './OEmbedLinkPreview';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

type OEmbedResolverProps = {
	meta: OEmbedPreviewMetadata;
};

const OEmbedResolver = ({ meta }: OEmbedResolverProps) => {
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
