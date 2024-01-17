import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { OEmbedPreviewMetadata } from './OEmbedPreviewMetadata';

const OEmbedHtmlPreview = ({ html, ...props }: OEmbedPreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>{html && <Box withRichContent dangerouslySetInnerHTML={{ __html: html }} />}</OEmbedCollapsible>
);

export default OEmbedHtmlPreview;
