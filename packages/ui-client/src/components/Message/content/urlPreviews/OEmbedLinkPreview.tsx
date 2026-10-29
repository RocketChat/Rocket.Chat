import { MessageGenericPreviewCoverImage } from '@rocket.chat/fuselage';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';
import { ExternalLink } from '../../../ExternalLink';

export type OEmbedLinkPreviewProps = OEmbedPreviewMetadata;

const OEmbedLinkPreview = ({ image, url, ...props }: OEmbedLinkPreviewProps) => (
	<OEmbedCollapsible url={url} {...props}>
		{image?.url && url && (
			<ExternalLink to={url} aria-label={props.title || url}>
				<MessageGenericPreviewCoverImage height={192} width={368} url={image?.url} />
			</ExternalLink>
		)}
	</OEmbedCollapsible>
);

export default OEmbedLinkPreview;
