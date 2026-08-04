import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

export type OEmbedImagePreviewProps = OEmbedPreviewMetadata;

const OEmbedImagePreview = ({ image, ...props }: OEmbedImagePreviewProps) => (
	<OEmbedCollapsible {...props}>
		{image?.url && <MessageGenericPreviewCoverImage height={192} width={368} url={image?.url} />}
	</OEmbedCollapsible>
);

export default OEmbedImagePreview;
