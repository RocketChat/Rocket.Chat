import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import OEmbedCollapsible from './OEmbedCollapsible';
import type { PreviewMetadata } from './PreviewList';

const OEmbedHtmlPreview = ({ html, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapsible {...props}>{html && <Box withRichContent dangerouslySetInnerHTML={{ __html: html }} />}</OEmbedCollapsible>
);

export default OEmbedHtmlPreview;
