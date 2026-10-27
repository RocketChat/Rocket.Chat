import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';
import { useMemo } from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

const purifyOptions = {
	ADD_TAGS: ['iframe'],
	ADD_ATTR: ['frameborder', 'allow', 'allowfullscreen', 'scrolling', 'src', 'style', 'referrerpolicy'],
	ALLOW_UNKNOWN_PROTOCOLS: true,
};

const OEmbedHtmlPreview = ({ html, ...props }: OEmbedPreviewMetadata) => {
	// Memoize the dangerouslySetInnerHTML object so its identity is stable across
	// re-renders. React 19 re-applies innerHTML when this object is a new reference
	// (even with an identical string), which reloads embedded iframes (e.g. YouTube)
	// on every re-render — visible as a flicker on new messages / reactions.
	const dangerous = useMemo(() => (html ? { __html: DOMPurify.sanitize(html, purifyOptions) } : undefined), [html]);

	return <OEmbedCollapsible {...props}>{dangerous && <Box withRichContent dangerouslySetInnerHTML={dangerous} />}</OEmbedCollapsible>;
};

export default OEmbedHtmlPreview;
