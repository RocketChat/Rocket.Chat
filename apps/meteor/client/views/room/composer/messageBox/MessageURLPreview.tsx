import React from 'react';
import type { ReactElement } from 'react';

import { normalizeMetadata } from '../../../../components/message/content/urlPreviews/urlMetadata';

export type MessageURLPreviewProps = {
	meta: Record<string, string>;
	url: string;
};

const MessageURLPreview = (props: MessageURLPreviewProps): ReactElement => {
	// TODO: Use meta to render a preview of the URL
	const normalizedMetadata = normalizeMetadata(props);
	console.log(normalizedMetadata);
	// TODO: Style this component
	return <h1>hello world</h1>;
};

export default MessageURLPreview;
