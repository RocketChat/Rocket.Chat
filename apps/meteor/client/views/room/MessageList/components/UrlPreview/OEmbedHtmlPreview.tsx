import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import OEmbedCollapseable from './OEmbedCollapseable';
import type { PreviewMetadata } from './PreviewList';

const OEmbedHtmlPreview = ({ html, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapseable {...props}>
		{html && <Box fontScale='p2' withRichContent dangerouslySetInnerHTML={{ __html: html }} />}
	</OEmbedCollapseable>
);

export default OEmbedHtmlPreview;
