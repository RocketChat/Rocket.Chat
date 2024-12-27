import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import type { ReactElement } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

const purifyOptions = {
	ADD_TAGS: ['iframe'],
	ADD_ATTR: ['frameborder', 'allow', 'allowfullscreen', 'scrolling', 'src', 'style', 'referrerpolicy'],
	ALLOW_UNKNOWN_PROTOCOLS: true,
};

const OEmbedHtmlPreview = ({ html, ...props }: OEmbedPreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>
		{html && <Box withRichContent dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, purifyOptions) }} />}
	</OEmbedCollapsible>
);

export default OEmbedHtmlPreview;
