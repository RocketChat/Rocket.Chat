import React, { ReactElement } from 'react';

import OEmbedCollapseable from './OEmbedCollapseable';
import type { PreviewMetadata } from './PreviewList';

const OEmbedImagePreview = ({ html, ...props }: PreviewMetadata): ReactElement => (
	<OEmbedCollapseable {...props}>{html && <div dangerouslySetInnerHTML={{ __html: html }} />}</OEmbedCollapseable>
);

export default OEmbedImagePreview;
